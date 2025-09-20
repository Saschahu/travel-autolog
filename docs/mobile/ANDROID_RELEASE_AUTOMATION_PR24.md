# Android Release Automation (PR24)

*Created: 2024-09-20T11:40:00Z*

## Overview

This document describes the automated release system implemented for Travel AutoLog, enabling streamlined GitHub Releases, automated changelog generation, and optional Play Store promotion workflows.

## What Was Added

### 1. Conventional Changelog & GitHub Releases

**Dependencies:**
- `conventional-changelog-cli` - Added as dev dependency for generating changelogs from conventional commits

**NPM Scripts:**
- `changelog:gen` - Generates/updates CHANGELOG.md from last 2 releases using conventional commits
- `release:notes` - Generates release notes for the latest release

**GitHub Workflow:** `.github/workflows/github-release.yml`
- **Trigger:** Push to tags matching `v*.*.*` pattern
- **Actions:**
  - Builds web application and syncs with Android
  - Creates signed release AAB using existing signing configuration
  - Generates release notes from conventional commits
  - Creates GitHub Release with AAB and ProGuard mapping attachments
  - Provides job summary with artifact paths and notes length

### 2. Release Drafter for PR Preview

**Configuration:** `.github/release-drafter.yml`
- Categorizes changes: Features (feat), Fixes (fix), Performance (perf), Security (sec), Documentation (docs), Chore (chore)
- Uses conventional commit patterns for automatic labeling
- Implements semantic versioning based on change types

**GitHub Workflow:** `.github/workflows/release-drafter.yml`
- **Trigger:** PR events (opened, synchronized) and pushes to main
- **Actions:**
  - Automatically drafts release notes on PRs
  - Shows preview of what will be included in next release
  - Does not publish releases automatically

### 3. Optional Play Store Promotion

**GitHub Workflow:** `.github/workflows/play-promote.yml`
- **Trigger:** Manual workflow dispatch only
- **Safe-by-default:** Requires explicit execution and defaults to dry-run mode
- **Inputs:**
  - `fromTrack` (default: internal) - Source track to promote from
  - `toTrack` (default: beta) - Target track to promote to
  - `releaseName` (optional) - Specific release name or latest tag
  - `dryRun` (default: true) - Safe mode, no actual promotion
- **Actions:**
  - Checks for PLAY_JSON secret availability
  - If available: decodes credentials and runs promotion
  - If not available: safely skips with informational message
  - Always cleans up credentials after execution

## Required Secrets

### From PR23 (Reused)
- Existing Android signing secrets (keystore, passwords, etc.)
- These are already configured and will be reused by the release workflow

### New Optional Secret
- `PLAY_JSON` (optional) - Base64-encoded Google Play service account JSON
  - Only required if you want to use the Play Store promotion workflow
  - If not configured, the promotion workflow will skip cleanly
  - To create: Download service account JSON from Google Play Console, encode with base64

## How to Tag a Release

### 1. Create and Push a Tag
```bash
# Create a new tag (use semantic versioning)
git tag v1.0.0

# Push the tag to trigger the release workflow
git push origin v1.0.0
```

### 2. What Happens Automatically
1. **GitHub Release workflow triggers** on the new tag
2. **Web application is built** using `npm run build`
3. **Android platform is added and synced** using Capacitor
4. **Signed release AAB is created** using existing signing configuration
5. **Release notes are generated** from conventional commits since last release
6. **GitHub Release is created** with:
   - Release name matching the tag (e.g., "v1.0.0")
   - Generated release notes as description
   - Signed AAB file attached
   - ProGuard mapping file attached

### 3. Conventional Commit Format
For proper changelog generation, use conventional commit format:
```
feat: add new GPS tracking feature
fix: resolve timezone calculation bug
docs: update API documentation
chore: update dependencies
```

## How to Run Play Store Promotion

### 1. Prerequisites
- Configure `PLAY_JSON` secret in repository settings
- Ensure you have appropriate permissions in Google Play Console
- Have a release already uploaded to the source track

### 2. Execute Promotion
1. Go to **Actions** tab in GitHub repository
2. Select **"Play Store Track Promotion"** workflow
3. Click **"Run workflow"**
4. Configure inputs:
   - **From Track:** Source track (internal, alpha, beta, production)
   - **To Track:** Target track (alpha, beta, production)
   - **Release Name:** (optional) Specific release or leave empty for latest
   - **Dry Run:** Keep `true` for testing, set to `false` for actual promotion
5. Click **"Run workflow"**

### 3. Dry Run Testing
Always test with `dryRun: true` first to verify:
- Credentials are working
- Release exists in source track
- Promotion parameters are correct

## Troubleshooting

### Missing Tag Error
**Problem:** Workflow doesn't trigger on tag push
**Solution:** Ensure tag follows `v*.*.*` pattern (e.g., `v1.0.0`, not `1.0.0`)

### Empty Release Notes
**Problem:** Generated release notes are empty
**Solutions:**
- Ensure commits follow conventional commit format
- Check if there are any commits since the last tag
- Verify conventional-changelog-cli is working: `npm run release:notes`

### Asset Upload Limits
**Problem:** AAB or mapping file upload fails
**Solutions:**
- GitHub has a 2GB limit per release asset
- Check file sizes in `android/app/build/outputs/`
- Ensure files exist before upload attempt

### Play Store Promotion Fails
**Problem:** Promotion workflow fails with authentication error
**Solutions:**
- Verify `PLAY_JSON` secret is correctly base64-encoded
- Check service account has necessary permissions in Play Console
- Ensure release exists in the source track
- Try with `dryRun: true` first

### Build Failures
**Problem:** Release workflow fails during build
**Solutions:**
- Check Android signing configuration is still valid
- Verify all required secrets are configured
- Test build locally: `npm run build && npx cap sync android`
- Check Java/Gradle compatibility (workflow uses Java 17)

## Next Steps

### Potential Enhancements
1. **Automatic Version Bumping**
   - Add workflow to automatically bump version in package.json on commits
   - Integrate with semantic-release for fully automated releases

2. **Multi-locale Store Listings**
   - Extend Google Play Publisher (GPP) configuration
   - Support multiple language store descriptions and metadata

3. **Release Validation**
   - Add automated testing on release builds
   - Integration with app signing verification

4. **Rollback Capabilities**
   - Implement workflow for quick rollback of problematic releases
   - Automated monitoring and rollback triggers

### Usage Recommendations
1. **Use conventional commits** consistently for proper changelog generation
2. **Test release process** on a feature branch first
3. **Always dry-run** Play Store promotions before actual execution
4. **Monitor release workflows** for any signing or build issues
5. **Keep secrets updated** as certificates and keys expire

## Workflow Files Summary

- `.github/workflows/github-release.yml` - Main release automation
- `.github/workflows/release-drafter.yml` - PR preview notes
- `.github/workflows/play-promote.yml` - Optional Play Store promotion
- `.github/release-drafter.yml` - Release Drafter configuration