#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Android Version Management Script
 * 
 * Converts Git tags (vX.Y.Z) into Android versionName and versionCode
 * Fallback for non-tag builds: 0.0.0-dev+<shortSHA> with timestamp-based versionCode
 */

function getGitInfo() {
  try {
    // Check if we're on a tag
    const tag = execSync('git describe --exact-match --tags HEAD 2>/dev/null', { encoding: 'utf8' }).trim();
    const shortSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    
    if (tag && tag.match(/^v\d+\.\d+\.\d+$/)) {
      // We're on a semver tag
      const version = tag.substring(1); // Remove 'v' prefix
      const [major, minor, patch] = version.split('.').map(Number);
      const versionCode = major * 10000 + minor * 100 + patch;
      
      return {
        versionName: version,
        versionCode: versionCode,
        isTag: true,
        shortSha
      };
    }
  } catch (e) {
    // Not on a tag or git error
  }
  
  // Fallback for non-tag builds
  try {
    const shortSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const timestamp = Math.floor(Date.now() / 1000);
    
    return {
      versionName: `0.0.0-dev+${shortSha}`,
      versionCode: timestamp % 2000000000, // Keep within int32 range
      isTag: false,
      shortSha
    };
  } catch (e) {
    // Git not available, use fallback
    return {
      versionName: '0.0.0-dev+unknown',
      versionCode: Math.floor(Date.now() / 1000) % 2000000000,
      isTag: false,
      shortSha: 'unknown'
    };
  }
}

function updateGradleVersion(versionName, versionCode) {
  const buildGradlePath = path.join(__dirname, '../android/app/build.gradle');
  
  if (!fs.existsSync(buildGradlePath)) {
    console.error('❌ android/app/build.gradle not found. Run `npx cap add android` first.');
    process.exit(1);
  }
  
  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Update versionCode and versionName
  content = content.replace(
    /versionCode\s+\d+/,
    `versionCode ${versionCode}`
  );
  content = content.replace(
    /versionName\s+"[^"]*"/,
    `versionName "${versionName}"`
  );
  
  fs.writeFileSync(buildGradlePath, content);
}

function writeVersionToEnv(versionName, versionCode) {
  // Write to environment for CI
  if (process.env.GITHUB_ACTIONS) {
    const envFile = process.env.GITHUB_ENV;
    if (envFile) {
      fs.appendFileSync(envFile, `ANDROID_VERSION_NAME=${versionName}\n`);
      fs.appendFileSync(envFile, `ANDROID_VERSION_CODE=${versionCode}\n`);
    }
  }
  
  // Also set process env for Gradle
  process.env.ANDROID_VERSION_NAME = versionName;
  process.env.ANDROID_VERSION_CODE = versionCode.toString();
}

function main() {
  const args = process.argv.slice(2);
  const printOnly = args.includes('--print');
  
  const { versionName, versionCode, isTag, shortSha } = getGitInfo();
  
  if (printOnly) {
    console.log(JSON.stringify({
      versionName,
      versionCode,
      isTag,
      shortSha
    }, null, 2));
    return;
  }
  
  console.log(`📱 Android Version: ${versionName} (${versionCode})`);
  console.log(`🏷️  Tag build: ${isTag}`);
  console.log(`📝 Git SHA: ${shortSha}`);
  
  // Update gradle file
  updateGradleVersion(versionName, versionCode);
  
  // Write to environment
  writeVersionToEnv(versionName, versionCode);
  
  console.log('✅ Version updated successfully');
}

if (require.main === module) {
  main();
}

module.exports = { getGitInfo, updateGradleVersion, writeVersionToEnv };