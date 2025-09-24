#!/usr/bin/env node

import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";

console.log("🔍 Validating Android Release CI Implementation (PR23)\n");

const checks = [];

// Check 1: Versioning script exists and is executable
try {
  const versionScript = "./scripts/android-version.cjs";
  if (existsSync(versionScript)) {
    // Test direct execution instead of npm run
    const output = JSON.parse(execSync("node scripts/android-version.cjs --print", { encoding: "utf8" }));
    checks.push({
      name: "✅ Versioning script works",
      status: "PASS",
      details: `Version: ${output.versionName}, Code: ${output.versionCode}`
    });
  } else {
    checks.push({
      name: "❌ Versioning script missing",
      status: "FAIL",
      details: `${versionScript} not found`
    });
  }
} catch (e) {
  checks.push({
    name: "❌ Versioning script error",
    status: "FAIL", 
    details: e.message
  });
}

// Check 2: Android build.gradle has signing config
try {
  const buildGradle = readFileSync("./android/app/build.gradle", "utf8");
  const hasSigningConfig = buildGradle.includes("signingConfigs") && buildGradle.includes("TAL_KEYSTORE_BASE64");
  const hasReleaseConfig = buildGradle.includes("minifyEnabled true") && buildGradle.includes("shrinkResources true");
  
  if (hasSigningConfig && hasReleaseConfig) {
    checks.push({
      name: "✅ Android signing configuration",
      status: "PASS",
      details: "Release signing config with env vars present"
    });
  } else {
    checks.push({
      name: "❌ Android signing configuration",
      status: "FAIL",
      details: `Signing: ${hasSigningConfig}, Release opts: ${hasReleaseConfig}`
    });
  }
} catch (e) {
  checks.push({
    name: "❌ Android build.gradle missing",
    status: "FAIL",
    details: e.message
  });
}

// Check 3: Root build.gradle has GPP plugin
try {
  const rootBuildGradle = readFileSync("./android/build.gradle", "utf8");
  const hasGPP = rootBuildGradle.includes("play-publisher");
  
  if (hasGPP) {
    checks.push({
      name: "✅ Gradle Play Publisher plugin",
      status: "PASS",
      details: "GPP plugin added to build.gradle"
    });
  } else {
    checks.push({
      name: "❌ Gradle Play Publisher plugin",
      status: "FAIL",
      details: "play-publisher not found in root build.gradle"
    });
  }
} catch (e) {
  checks.push({
    name: "❌ Root build.gradle missing",
    status: "FAIL",
    details: e.message
  });
}

// Check 4: GitHub Actions workflow exists
try {
  const workflow = readFileSync("./.github/workflows/android-release.yml", "utf8");
  const hasTriggers = workflow.includes("workflow_dispatch") && workflow.includes("tags:");
  const hasSecrets = workflow.includes("TAL_KEYSTORE_BASE64") && workflow.includes("PLAY_JSON");
  const hasSteps = workflow.includes("bundleRelease") && workflow.includes("publishReleaseBundle");
  
  if (hasTriggers && hasSecrets && hasSteps) {
    checks.push({
      name: "✅ GitHub Actions workflow",
      status: "PASS",
      details: "Complete workflow with triggers, secrets, and build steps"
    });
  } else {
    checks.push({
      name: "❌ GitHub Actions workflow",
      status: "FAIL",
      details: `Triggers: ${hasTriggers}, Secrets: ${hasSecrets}, Steps: ${hasSteps}`
    });
  }
} catch (e) {
  checks.push({
    name: "❌ GitHub Actions workflow missing",
    status: "FAIL",
    details: e.message
  });
}

// Check 5: Package.json has new scripts
try {
  const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));
  const hasReleaseScript = packageJson.scripts["android:bundle:release"];
  const hasVersionScript = packageJson.scripts["android:version:print"];
  
  if (hasReleaseScript && hasVersionScript) {
    checks.push({
      name: "✅ NPM scripts added",
      status: "PASS",
      details: "android:bundle:release and android:version:print available"
    });
  } else {
    checks.push({
      name: "❌ NPM scripts missing",
      status: "FAIL",
      details: `Release: ${!!hasReleaseScript}, Version: ${!!hasVersionScript}`
    });
  }
} catch (e) {
  checks.push({
    name: "❌ Package.json error",
    status: "FAIL",
    details: e.message
  });
}

// Check 6: .gitignore has security exclusions
try {
  const gitignore = readFileSync("./.gitignore", "utf8");
  const hasKeystoreExclusions = gitignore.includes("*.keystore") && gitignore.includes("*.jks");
  const hasServiceAccountExclusions = gitignore.includes("service-account.json");
  
  if (hasKeystoreExclusions && hasServiceAccountExclusions) {
    checks.push({
      name: "✅ Security .gitignore rules",
      status: "PASS",
      details: "Keystore and service account files excluded"
    });
  } else {
    checks.push({
      name: "❌ Security .gitignore rules",
      status: "FAIL",
      details: `Keystore: ${hasKeystoreExclusions}, ServiceAccount: ${hasServiceAccountExclusions}`
    });
  }
} catch (e) {
  checks.push({
    name: "❌ .gitignore error",
    status: "FAIL",
    details: e.message
  });
}

// Check 7: Documentation exists
try {
  const docPath = "./docs/mobile/ANDROID_RELEASE_CI_PR23.md";
  if (existsSync(docPath)) {
    const doc = readFileSync(docPath, "utf8");
    const hasSigningSection = doc.includes("## 🔐 Signing Configuration");
    const hasVersioningSection = doc.includes("## 📱 Versioning Scheme");
    const hasPlayStoreSection = doc.includes("## 🎮 Play Store Upload");
    const hasSecretsSection = doc.includes("## 🔑 GitHub Secrets Setup");
    
    if (hasSigningSection && hasVersioningSection && hasPlayStoreSection && hasSecretsSection) {
      checks.push({
        name: "✅ Complete documentation",
        status: "PASS",
        details: `${Math.round(doc.length/1000)}KB documentation with all sections`
      });
    } else {
      checks.push({
        name: "❌ Incomplete documentation",
        status: "FAIL",
        details: `Missing sections - Signing:${hasSigningSection}, Versioning:${hasVersioningSection}, Play:${hasPlayStoreSection}, Secrets:${hasSecretsSection}`
      });
    }
  } else {
    checks.push({
      name: "❌ Documentation missing",
      status: "FAIL",
      details: `${docPath} not found`
    });
  }
} catch (e) {
  checks.push({
    name: "❌ Documentation error",
    status: "FAIL",
    details: e.message
  });
}

// Print results
console.log("📋 Validation Results:\n");
checks.forEach(check => {
  console.log(`${check.name}`);
  console.log(`   ${check.details}\n`);
});

const passCount = checks.filter(c => c.status === "PASS").length;
const totalCount = checks.length;

console.log(`\n🎯 Summary: ${passCount}/${totalCount} checks passed`);

if (passCount === totalCount) {
  console.log("\n🎉 Android Release CI implementation complete!");
  console.log("🚀 Ready to create PR and test with first release tag");
} else {
  console.log("\n⚠️  Some checks failed - review implementation");
  process.exit(1);
}