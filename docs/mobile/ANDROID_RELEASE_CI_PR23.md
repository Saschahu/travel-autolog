# Android Release CI with Signed AAB + Play Store Upload (PR23)

**Created:** December 26, 2024  
**Repository:** Travel AutoLog  
**Branch:** mobile/android-release-ci-pr23  

## Overview

This document describes the complete Android release CI implementation that enables:

- ✅ **Signed AAB builds** from environment variables (secure keystore handling)
- ✅ **Semantic versioning** from Git tags (`vX.Y.Z` → `versionName` + computed `versionCode`)
- ✅ **Optional Play Store uploads** via Gradle Play Publisher (GPP)
- ✅ **Fail-safe defaults** (skips steps when secrets missing, never fails CI)
- ✅ **Complete artifact management** with build mappings and job summaries

## 🔐 Signing Configuration

### Environment Variables

The release signing reads credentials from these environment variables:

| Variable | Purpose | Example |
|----------|---------|---------|
| `TAL_KEYSTORE_BASE64` | Base64-encoded keystore file (.jks/.keystore) | `MIIKs...` (long base64 string) |
| `TAL_KEY_ALIAS` | Key alias within keystore | `travel-autolog` or `my-app-key` |
| `TAL_KEY_PASSWORD` | Password for the specific key | `MySecureKeyPass123` |
| `TAL_STORE_PASSWORD` | Password for the keystore file | `MySecureStorePass123` |

### How Signing Works

1. **CI Build Time:** The workflow decodes `TAL_KEYSTORE_BASE64` into a temporary `.keystore` file
2. **Gradle Configuration:** The `android/app/build.gradle` reads env vars and configures `signingConfigs.release`
3. **Local Development:** Falls back to `~/.gradle/travel-autolog-release.keystore` if it exists
4. **Unsigned Fallback:** If no keystore is available, builds proceed unsigned (debug signing)

```gradle
signingConfigs {
    release {
        if (System.getenv("TAL_KEYSTORE_BASE64")) {
            // Decode base64 keystore for CI
            def keystoreFile = new File(buildDir, "travel-autolog-release.keystore")
            keystoreFile.bytes = System.getenv("TAL_KEYSTORE_BASE64").decodeBase64()
            storeFile keystoreFile
            keyAlias System.getenv("TAL_KEY_ALIAS")
            keyPassword System.getenv("TAL_KEY_PASSWORD")
            storePassword System.getenv("TAL_STORE_PASSWORD")
        }
    }
}
```

## 📱 Versioning Scheme

### From Git Tags

**Tag Format:** `vX.Y.Z` (e.g., `v1.2.3`, `v2.0.0`)

- **versionName:** `X.Y.Z` (removes `v` prefix)
- **versionCode:** `X*10000 + Y*100 + Z`

**Examples:**
```
v1.0.0  → versionName="1.0.0", versionCode=10000
v1.2.3  → versionName="1.2.3", versionCode=10203  
v2.5.10 → versionName="2.5.10", versionCode=20510
```

### Non-Tag Builds (Development)

**Format:** `0.0.0-dev+<shortSHA>`

- **versionName:** `0.0.0-dev+a1b2c3d` 
- **versionCode:** `timestamp % 2000000000` (keeps within int32 range)

### Version Script Usage

```bash
# Print current version info
npm run android:version:print

# Update gradle with current version
node scripts/android-version.cjs
```

## 🚀 CI Workflow Breakdown

### Triggers

1. **Manual Dispatch** (`workflow_dispatch`)
   - Option to enable Play Store upload
   - Choose track (internal/alpha/beta/production)

2. **Tag Push** (`push: tags: v*.*.*`)
   - Automatic builds on semver tags
   - Auto-uploads to Play Store if `PLAY_JSON` secret exists

### Build Steps

```yaml
jobs:
  build-android-release:
    steps:
      - checkout (with full git history)
      - extract version from tag/commit
      - setup Node.js 20 + npm cache
      - install dependencies (npm ci)
      - build web assets (npm run build)  
      - sync Capacitor (npx cap sync android)
      - setup Java 17 + Gradle cache
      - decode keystore (if TAL_KEYSTORE_BASE64 exists)
      - set Android version (scripts/android-version.cjs)
      - build signed AAB (./gradlew :app:bundleRelease)
      - setup Play Store credentials (if PLAY_JSON exists)
      - upload to Play Store (if enabled)
      - upload artifacts (AAB + ProGuard mappings)
      - generate job summary
```

### Artifacts Generated

- **AAB Bundle:** `android/app/build/outputs/bundle/release/app-release.aab`
- **ProGuard Mappings:** `android/app/build/outputs/mapping/release/`
- **Artifact Name:** `travel-autolog-release-{version}-{run_number}`

## 🎮 Play Store Upload (Optional)

### Configuration

The Gradle Play Publisher (GPP) plugin is configured to:

- **Track:** Configurable via `PLAY_TRACK` env var (default: `internal`)
- **Release Status:** Always `draft` for safety
- **Bundle Format:** Always uploads AAB (not APK)
- **Dry Run:** Default `true` unless explicitly disabled

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `PLAY_JSON` | Base64-encoded service account JSON | *(required)* |
| `PLAY_TRACK` | Target track for upload | `internal` |
| `PLAY_DRY_RUN` | If `false`, actually uploads; otherwise dry run | `true` |

### How Upload Works

1. **Credential Setup:** CI decodes `PLAY_JSON` to `~/.config/gpp/service-account.json`
2. **Track Selection:** Uses `PLAY_TRACK` env var or defaults to `internal`
3. **Upload:** Runs `./gradlew publishReleaseBundle`
4. **Safety:** Creates drafts only, requires manual release in Play Console

### Skip Conditions

Upload is **skipped** when:
- `PLAY_JSON` secret is not set
- Manual workflow without `play_upload=true`
- Dry run mode (logs actions without uploading)

## 🔑 GitHub Secrets Setup

### Required Secrets (for signed builds)

Add these in **GitHub Repository Settings → Secrets and Variables → Actions**:

```
TAL_KEYSTORE_BASE64=<base64_encoded_keystore_file>
TAL_KEY_ALIAS=travel-autolog
TAL_KEY_PASSWORD=<your_key_password>
TAL_STORE_PASSWORD=<your_store_password>
```

### Optional Secrets (for Play Store)

```
PLAY_JSON=<base64_encoded_service_account_json>
PLAY_TRACK=internal
PLAY_DRY_RUN=true
```

### How to Generate Secrets

#### 1. Android Keystore

```bash
# Generate new keystore (one-time setup)
keytool -genkey -v -keystore travel-autolog-release.keystore \
    -alias travel-autolog -keyalg RSA -keysize 2048 -validity 10000

# Convert to base64 for GitHub secret
base64 -i travel-autolog-release.keystore | tr -d '\n'
```

#### 2. Play Store Service Account

1. **Google Play Console** → **Setup** → **API access**
2. **Create new service account** or use existing
3. **Download JSON key file**
4. **Convert to base64:**
   ```bash
   base64 -i service-account.json | tr -d '\n'
   ```

## 🛠️ Local Release Build Guide

### Prerequisites

```bash
# 1. Ensure Android SDK and tools are installed
export ANDROID_HOME=/path/to/android-sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools

# 2. Create local keystore (first time only)
keytool -genkey -v -keystore ~/.gradle/travel-autolog-release.keystore \
    -alias travel-autolog -keyalg RSA -keysize 2048 -validity 10000
```

### Local gradle.properties

Create `~/.gradle/gradle.properties` with your keystore details:

```properties
# Travel AutoLog Release Signing
TAL_KEY_ALIAS=travel-autolog
TAL_KEY_PASSWORD=YourKeyPassword
TAL_STORE_PASSWORD=YourStorePassword
```

### Build Commands

```bash
# Install dependencies
npm ci

# Build web assets  
npm run build

# Add/sync Android platform
npx cap add android  # (first time only)
npx cap sync android

# Set version from current git state
node scripts/android-version.cjs

# Build signed release AAB
npm run android:bundle:release

# Find your AAB
ls -la android/app/build/outputs/bundle/release/
```

### Verification

```bash
# Check AAB signing
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab

# Extract version info
npm run android:version:print
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Keystore was tampered with, or password was incorrect"

**Cause:** Wrong `TAL_STORE_PASSWORD` or corrupted base64 encoding

**Solutions:**
- Verify base64 encoding: `base64 -d <<< "$TAL_KEYSTORE_BASE64" > test.keystore`
- Test keystore locally: `keytool -list -keystore test.keystore`
- Check password in GitHub Secrets

#### 2. "Failed to find key with alias 'travel-autolog'"

**Cause:** `TAL_KEY_ALIAS` doesn't match keystore contents

**Solutions:**
- List aliases: `keytool -list -keystore your.keystore`
- Update `TAL_KEY_ALIAS` secret to match

#### 3. AGP "Variant 'release' does not exist"

**Cause:** Gradle sync issues or missing signing config

**Solutions:**
```bash
cd android
./gradlew clean
./gradlew tasks --all | grep bundle
```

#### 4. GPP "Service account not found"

**Cause:** Invalid `PLAY_JSON` or missing Play Console permissions

**Solutions:**
- Verify base64: `base64 -d <<< "$PLAY_JSON" > test.json && cat test.json`
- Check service account permissions in Play Console
- Ensure app exists in Play Console

#### 5. "Build timeout" in CI

**Cause:** Large dependency downloads or slow builds

**Solutions:**
- Check Gradle cache configuration
- Review build logs for hanging tasks
- Consider split workflows for large projects

### Debug Commands

```bash
# Gradle debug info
cd android && ./gradlew :app:bundleRelease --info --stacktrace

# Check signing config
cd android && ./gradlew signingReport

# Verify Capacitor sync
npx cap doctor

# Test version script
node scripts/android-version.cjs --print
```

## 📋 Developer NPM Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `android:bundle:release` | Build signed AAB | `cd android && ./gradlew :app:bundleRelease` |
| `android:version:print` | Show current version info | `node scripts/android-version.cjs --print` |

## ⏭️ Next Steps

### Immediate (Post-PR)

1. **Test Workflow:** Create a test tag to verify full pipeline
2. **Add Secrets:** Configure GitHub repository secrets
3. **First Release:** Tag `v1.0.0` and verify signed AAB generation

### Future Enhancements

1. **Track Promotion:**
   ```bash
   # Promote from internal → alpha → beta → production
   ./gradlew promoteArtifact --from-track internal --promote-track alpha
   ```

2. **Changelog Automation:**
   - Parse git commits since last tag
   - Generate Play Store release notes
   - Integration with conventional commits

3. **Play Store Metadata Sync:**
   - Store descriptions, screenshots in repository
   - Sync with Play Console via GPP
   - Multi-language support

4. **Advanced Versioning:**
   - Separate major/minor/patch workflows
   - Prerelease tags (`v1.0.0-beta.1`)
   - Build number from CI run counter

5. **Testing Integration:**
   - Upload to Firebase App Distribution
   - Automated testing before Play Store
   - Integration tests on release builds

6. **Notifications:**
   - Slack/Discord notifications on release
   - Email notifications for failed builds
   - Play Console status webhooks

## 🎯 Summary

This implementation provides a **complete, production-ready Android release pipeline** with:

- ✅ **Security-first approach** (no credentials in code/logs)
- ✅ **Flexible deployment** (manual or automatic)  
- ✅ **Comprehensive versioning** (semantic from tags)
- ✅ **Fail-safe defaults** (graceful degradation without secrets)
- ✅ **Developer-friendly** (local build support + clear documentation)

The system is designed to grow with your project needs while maintaining security and reliability standards for production Android app distribution.