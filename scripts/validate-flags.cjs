#!/usr/bin/env node

/**
 * Feature Flags Validation Script
 * 
 * This script validates:
 * 1. No unused flag registry entries
 * 2. All flags referenced in code exist in registry
 * 3. No dangerouslySetInnerHTML in flag descriptions
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findFilesRecursively(dir, extensions, exclude = []) {
  const results = [];
  
  function searchDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!exclude.some(pattern => fullPath.includes(pattern))) {
          searchDir(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  }
  
  searchDir(dir);
  return results;
}

function extractFlagKeys(content) {
  const flagPattern = /getFlag\s*\(\s*['"]([\w.]+)['"]\s*\)/g;
  const keys = [];
  let match;
  
  while ((match = flagPattern.exec(content)) !== null) {
    keys.push(match[1]);
  }
  
  return keys;
}

function validateFlags() {
  log('blue', '🔍 Validating feature flags...');
  
  let hasErrors = false;
  
  // 1. Load flag registry
  const flagsPath = path.join(__dirname, '../src/flags/flags.ts');
  if (!fs.existsSync(flagsPath)) {
    log('red', '❌ Flag registry not found at src/flags/flags.ts');
    return false;
  }
  
  const flagsContent = fs.readFileSync(flagsPath, 'utf8');
  
  // Extract flag keys from registry
  const registryPattern = /['"]([^'"]+)['"]\s*:\s*\{[^}]*key:\s*['"]([^'"]+)['"]/g;
  const registryKeys = new Set();
  const registryDescriptions = [];
  
  let match;
  while ((match = registryPattern.exec(flagsContent)) !== null) {
    registryKeys.add(match[1]);
    
    // Extract description for dangerous content check
    const descMatch = flagsContent.match(
      new RegExp(`['"]${match[1]}['"]\\s*:\\s*\\{[^}]*description:\\s*['"]([^'"]+)['"]`, 'g')
    );
    if (descMatch) {
      registryDescriptions.push(descMatch[0]);
    }
  }
  
  log('green', `📋 Found ${registryKeys.size} flags in registry`);
  
  // 2. Find all code files (excluding tests)
  const srcDir = path.join(__dirname, '../src');
  const codeFiles = findFilesRecursively(
    srcDir, 
    ['.ts', '.tsx'], 
    ['node_modules', '.git', 'dist', 'build', '__tests__', '.test.', '.spec.']
  );
  
  // 3. Extract flag usage from code
  const usedFlags = new Set();
  
  for (const file of codeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const flagKeys = extractFlagKeys(content);
    
    for (const key of flagKeys) {
      usedFlags.add(key);
    }
  }
  
  log('green', `📝 Found ${usedFlags.size} flag usages in code`);
  
  // 4. Check for unused registry entries
  const unusedFlags = [];
  for (const registryKey of registryKeys) {
    if (!usedFlags.has(registryKey)) {
      unusedFlags.push(registryKey);
    }
  }
  
  if (unusedFlags.length > 0) {
    log('yellow', `⚠️  Warning: ${unusedFlags.length} unused flags in registry:`);
    for (const flag of unusedFlags) {
      log('yellow', `   - ${flag}`);
    }
    // This is a warning, not an error
  }
  
  // 5. Check for flags used in code but not in registry
  const missingFlags = [];
  for (const usedFlag of usedFlags) {
    if (!registryKeys.has(usedFlag)) {
      missingFlags.push(usedFlag);
    }
  }
  
  if (missingFlags.length > 0) {
    log('red', `❌ Error: ${missingFlags.length} flags used in code but missing from registry:`);
    for (const flag of missingFlags) {
      log('red', `   - ${flag}`);
    }
    hasErrors = true;
  }
  
  // 6. Check for dangerous content in descriptions
  const dangerousPatterns = [
    /dangerouslySetInnerHTML/i,
    /<script/i,
    /javascript:/i,
    /eval\s*\(/i
  ];
  
  for (const description of registryDescriptions) {
    for (const pattern of dangerousPatterns) {
      if (pattern.test(description)) {
        log('red', `❌ Error: Dangerous content found in flag description:`);
        log('red', `   ${description}`);
        hasErrors = true;
      }
    }
  }
  
  // 7. Final report
  if (hasErrors) {
    log('red', '❌ Flag validation failed!');
    return false;
  } else {
    log('green', '✅ Flag validation passed!');
    log('green', `   - ${registryKeys.size} flags in registry`);
    log('green', `   - ${usedFlags.size} flags used in code`);
    log('green', `   - ${unusedFlags.length} unused flags (warnings only)`);
    return true;
  }
}

// Run validation
const success = validateFlags();
process.exit(success ? 0 : 1);