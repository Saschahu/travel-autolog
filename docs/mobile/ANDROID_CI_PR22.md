# Android CI Implementation - Debug APK & AAB Builds (PR #22)

**Created:** 2024-12-28 17:30 UTC  
**Workflow:** `.github/workflows/android-ci.yml`  
**Branch:** `mobile/android-ci-artifacts-pr22`

## Overview

This PR implements automated Android CI builds that generate Debug APK and AAB (Android App Bundle) artifacts for every pull request and feature branch push. The workflow is designed to work without any secrets or signing configuration, making it perfect for development builds and testing.

## Workflow Details

### Triggers
- **Pull Requests:** `main`, `develop` branches
- **Push Events:** `perf/**`, `feat/**`, `fix/**` branches

### Build Steps
1. **Environment Setup**
   - Ubuntu Latest runner
   - Node.js 20 with npm cache
   - JDK 17 (Temurin distribution) with Gradle cache

2. **Build Process**
   - Install NPM dependencies (`npm ci`)
   - Build web assets (`npm run build` → `dist/` folder)
   - Sync Capacitor (`npx cap sync android --no-interactive`)
   - Verify Gradle wrapper
   - Run Android Lint (non-blocking, continues on failure)
   - Assemble Debug APK (`./gradlew :app:assembleDebug`)
   - Build Debug AAB (`./gradlew :app:bundleDebug`)

3. **Artifact Management**
   - Upload both APK and AAB files
   - Retention: 30 days
   - Artifact name: `android-debug-builds`

### Caching Strategy
- **NPM Cache:** Automatically cached by `actions/setup-node@v4`
- **Gradle Cache:** Automatically cached by `actions/setup-java@v4`
- **JDK:** Pre-installed Temurin JDK 17 with build cache

## Artifact Details

### File Locations
- **APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **AAB:** `android/app/build/outputs/bundle/debug/app-debug.aab`

### Installation Instructions

#### Installing APK on Device
```bash
# Via ADB (Android Debug Bridge)
adb install -r app-debug.apk

# Or drag & drop APK to device and install manually
# Settings → Security → Install unknown apps → Enable for File Manager
```

#### Testing AAB Locally
```bash
# Extract APK from AAB using bundletool
java -jar bundletool.jar build-apks --bundle=app-debug.aab --output=app.apks
java -jar bundletool.jar install-apks --apks=app.apks
```

## NPM Scripts Added

The following scripts were added to `package.json` to support Android development:

```json
{
  "android:sync": "npx cap sync android",
  "android:open": "npx cap open android", 
  "android:run": "npx cap run android -l --external",
  "verify:local": "node scripts/verify-local.mjs"
}
```

## Release Builds (Future Implementation)

To enable signed Release builds later, you'll need:

### 1. Keystore Setup
```bash
# Generate keystore (one-time setup)
keytool -genkey -v -keystore release-key.keystore -alias travel-autolog \
  -keyalg RSA -keysize 2048 -validity 10000
```

### 2. GitHub Secrets
Add these secrets to your repository:
- `ANDROID_KEYSTORE_FILE` (base64 encoded keystore)
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

### 3. Gradle Signing Configuration
Update `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('release-key.keystore')
            storePassword System.getenv('KEYSTORE_PASSWORD')
            keyAlias System.getenv('KEY_ALIAS') 
            keyPassword System.getenv('KEY_PASSWORD')
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 4. Release Workflow Steps
```yaml
- name: Decode Keystore
  run: echo "${{ secrets.ANDROID_KEYSTORE_FILE }}" | base64 -d > android/app/release-key.keystore

- name: Assemble Release APK  
  env:
    KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
    KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
    KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
  run: cd android && ./gradlew :app:assembleRelease

- name: Build Release AAB
  env:
    KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
    KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }} 
    KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
  run: cd android && ./gradlew :app:bundleRelease
```

## Troubleshooting

### Common Issues

#### 1. SDK/NDK Version Mismatch
```bash
# Error: Failed to find target with hash string 'android-34'
# Solution: Update compileSdkVersion in android/app/build.gradle
android {
    compileSdkVersion 34
    targetSdkVersion 34
}
```

#### 2. Gradle Daemon Memory Issues
```bash
# Error: Out of memory during build
# Solution: Add to android/gradle.properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=512m
org.gradle.parallel=true
org.gradle.caching=true
```

#### 3. Node-gyp Build Failures
```bash
# Error: npm install fails with node-gyp errors
# Solution: Ensure Python and build tools are available
- name: Setup Build Tools
  run: |
    sudo apt-get update
    sudo apt-get install -y python3 build-essential
```

#### 4. Capacitor Sync Issues
```bash
# Error: Could not find Capacitor config
# Solution: Ensure capacitor.config.ts exists and is valid
npx cap doctor  # Diagnose Capacitor setup issues
```

#### 5. Android Platform Missing
```bash
# Error: Android platform not found
# Solution: Platform gets added automatically, but if needed:
npx cap add android --yes
```

### Debugging Failed Builds

1. **Check Workflow Logs:** Click on failed workflow run in GitHub Actions
2. **Download Artifacts:** Even if build partially fails, artifacts may be available
3. **Local Reproduction:** Run same commands locally:
   ```bash
   npm ci
   npm run build
   npx cap sync android
   cd android && ./gradlew assembleDebug
   ```

## Next Steps

### Immediate (Post-PR)
- [ ] Test workflow on actual PR
- [ ] Verify APK installation on physical device
- [ ] Validate AAB structure and content

### Future Enhancements
- [ ] **Release Pipeline:** Implement signed release builds
- [ ] **Play Store Upload:** Automate AAB upload to Google Play Console
- [ ] **Fastlane Integration:** Optional mobile DevOps toolkit for advanced workflows
- [ ] **Testing Integration:** Add automated UI tests before build
- [ ] **Performance Monitoring:** Integrate APK size tracking and performance metrics

### Optional Advanced Features
- [ ] **Multi-flavor Builds:** Development, Staging, Production variants
- [ ] **Automatic Version Bumping:** Based on commit messages or tags
- [ ] **Changelog Generation:** Automated release notes from commits
- [ ] **Slack/Discord Notifications:** Build status and artifact links

## Technical Notes

### Build Configuration
- **Android Gradle Plugin:** Compatible with JDK 17
- **Target SDK:** 34 (Android 14)
- **Minimum SDK:** 24 (Android 7.0)
- **Build Tools:** 34.0.0
- **Capacitor:** v7.4.2

### Security Considerations
- Debug builds only (no signing required)
- No secrets or sensitive data in workflow
- Artifacts are public but temporary (30 days)
- Production releases require separate secure pipeline

### Performance Optimizations  
- Gradle and NPM caching reduces build time
- Parallel builds enabled by default
- Incremental builds when possible
- Artifact compression for faster uploads

---

**Note:** This CI system focuses on development builds. For production releases to Google Play Store, implement the signing configuration and release pipeline described above.