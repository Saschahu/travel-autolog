#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const SUPPORTED_LOCALES = ['en', 'de', 'nb'];
const REQUIRED_NAMESPACES = ['common', 'jobs'];

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Load and validate locale file
function loadLocaleFile(locale, namespace) {
  const filePath = path.join(projectRoot, 'src', 'i18n', 'locales', locale, `${namespace}.ts`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract the default export object using regex
    const exportMatch = content.match(/export\s+default\s+({[\s\S]*})\s*as\s+const;?/);
    if (!exportMatch) {
      throw new Error(`Could not parse default export in ${filePath}`);
    }
    
    // Use Function constructor for safe evaluation (safer than eval)
    const objectCode = exportMatch[1];
    const translations = new Function('return ' + objectCode)();
    
    return translations;
  } catch (err) {
    throw new Error(`Failed to load ${filePath}: ${err.message}`);
  }
}

// Extract all keys from nested object
function extractKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys.sort();
}

// Validate JSON structure and keys
function validateLocaleStructure(translations, locale, namespace) {
  const issues = [];
  
  // Check for empty values
  function checkValues(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        checkValues(value, currentPath);
      } else if (typeof value === 'string' && value.trim() === '') {
        issues.push(`Empty translation value at ${currentPath}`);
      } else if (typeof value !== 'string') {
        issues.push(`Invalid value type at ${currentPath}: expected string, got ${typeof value}`);
      }
    }
  }
  
  checkValues(translations);
  return issues;
}

// Main validation function
async function validateI18n() {
  let hasErrors = false;
  let hasWarnings = false;
  
  info('🔍 Starting i18n validation...');
  
  // Check if locales directory exists
  const localesDir = path.join(projectRoot, 'src', 'i18n', 'locales');
  if (!fs.existsSync(localesDir)) {
    error(`Locales directory not found: ${localesDir}`);
    return false;
  }
  
  // Load all translations
  const allTranslations = {};
  
  for (const locale of SUPPORTED_LOCALES) {
    allTranslations[locale] = {};
    
    for (const namespace of REQUIRED_NAMESPACES) {
      try {
        allTranslations[locale][namespace] = loadLocaleFile(locale, namespace);
        success(`Loaded ${locale}/${namespace}.ts`);
      } catch (err) {
        error(`Failed to load ${locale}/${namespace}.ts: ${err.message}`);
        hasErrors = true;
      }
    }
  }
  
  if (hasErrors) {
    return false;
  }
  
  // Validate each namespace across all locales
  for (const namespace of REQUIRED_NAMESPACES) {
    info(`\n📋 Validating namespace: ${namespace}`);
    
    // Get all keys from all locales for this namespace
    const allKeys = new Set();
    const localeKeys = {};
    
    for (const locale of SUPPORTED_LOCALES) {
      if (allTranslations[locale][namespace]) {
        const keys = extractKeys(allTranslations[locale][namespace]);
        localeKeys[locale] = new Set(keys);
        keys.forEach(key => allKeys.add(key));
      }
    }
    
    // Check for missing keys
    for (const locale of SUPPORTED_LOCALES) {
      const missing = [];
      allKeys.forEach(key => {
        if (!localeKeys[locale]?.has(key)) {
          missing.push(key);
        }
      });
      
      if (missing.length > 0) {
        error(`Missing keys in ${locale}/${namespace}: ${missing.join(', ')}`);
        hasErrors = true;
      }
    }
    
    // Check for extra keys
    for (const locale of SUPPORTED_LOCALES) {
      const extra = [];
      localeKeys[locale]?.forEach(key => {
        if (!allKeys.has(key)) {
          extra.push(key);
        }
      });
      
      if (extra.length > 0) {
        warning(`Extra keys in ${locale}/${namespace}: ${extra.join(', ')}`);
        hasWarnings = true;
      }
    }
    
    // Validate structure and values
    for (const locale of SUPPORTED_LOCALES) {
      if (allTranslations[locale][namespace]) {
        const issues = validateLocaleStructure(allTranslations[locale][namespace], locale, namespace);
        if (issues.length > 0) {
          issues.forEach(issue => warning(`${locale}/${namespace}: ${issue}`));
          hasWarnings = true;
        }
      }
    }
  }
  
  // Final summary
  if (hasErrors) {
    error('\n❌ i18n validation failed with errors!');
    return false;
  } else if (hasWarnings) {
    warning('\n⚠️  i18n validation completed with warnings.');
    return true;
  } else {
    success('\n✅ i18n validation passed!');
    return true;
  }
}

// Run validation
validateI18n()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    error(`Validation failed: ${err.message}`);
    process.exit(1);
  });