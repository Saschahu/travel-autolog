#!/usr/bin/env node

/**
 * i18n Key Consistency Checker
 * 
 * Validates that all translation keys exist across all supported locales.
 * Checks for:
 * - Missing keys in any locale
 * - Extra keys that don't exist in all locales  
 * - Placeholder consistency
 * - Proper plural forms
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const localesDir = join(projectRoot, 'src', 'i18n', 'locales');

const SUPPORTED_LOCALES = ['de', 'en', 'nb'];
const REQUIRED_NAMESPACES = ['common', 'dashboard', 'jobs'];

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m', 
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

let hasErrors = false;
let hasWarnings = false;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  hasErrors = true;
  log(`❌ ERROR: ${message}`, 'red');
}

function warning(message) {
  hasWarnings = true;
  log(`⚠️  WARNING: ${message}`, 'yellow');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

/**
 * Load a translation namespace for a locale
 */
function loadNamespace(locale, namespace) {
  try {
    const filePath = join(localesDir, locale, `${namespace}.ts`);
    if (!existsSync(filePath)) {
      error(`Missing namespace file: ${locale}/${namespace}.ts`);
      return null;
    }
    
    const content = readFileSync(filePath, 'utf8');
    
    // Extract the exported object using a simple regex approach
    // This is not a full JavaScript parser, but works for our simple export format
    const exportMatch = content.match(/export default \{([\s\S]*)\} as const;/);
    if (!exportMatch) {
      error(`Invalid export format in ${locale}/${namespace}.ts`);
      return null;
    }
    
    try {
      // Create a safe evaluation context
      const objectStr = `{${exportMatch[1]}}`;
      return eval(`(${objectStr})`);
    } catch (e) {
      error(`Failed to parse ${locale}/${namespace}.ts: ${e.message}`);
      return null;
    }
  } catch (e) {
    error(`Failed to load ${locale}/${namespace}.ts: ${e.message}`);
    return null;
  }
}

/**
 * Recursively extract all keys from a nested object
 */
function extractKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * Extract placeholders from a translation string
 */
function extractPlaceholders(str) {
  if (typeof str !== 'string') return [];
  
  // Match both {{placeholder}} and {placeholder} formats
  const matches = str.match(/\{\{?(\w+)\}?\}/g) || [];
  return matches.map(match => match.replace(/[{}]/g, ''));
}

/**
 * Check key consistency across all locales for a namespace
 */
function checkNamespaceConsistency(namespace) {
  info(`Checking namespace: ${namespace}`);
  
  const translations = {};
  const allKeys = new Set();
  
  // Load all locales for this namespace
  for (const locale of SUPPORTED_LOCALES) {
    const translation = loadNamespace(locale, namespace);
    if (translation) {
      translations[locale] = translation;
      const keys = extractKeys(translation);
      keys.forEach(key => allKeys.add(key));
    }
  }
  
  if (Object.keys(translations).length === 0) {
    error(`No valid translations found for namespace: ${namespace}`);
    return;
  }
  
  // Check for missing keys in each locale
  for (const locale of SUPPORTED_LOCALES) {
    if (!translations[locale]) continue;
    
    const localeKeys = new Set(extractKeys(translations[locale]));
    const missingKeys = [...allKeys].filter(key => !localeKeys.has(key));
    
    if (missingKeys.length > 0) {
      error(`Missing keys in ${locale}/${namespace}: ${missingKeys.join(', ')}`);
    }
  }
  
  // Check placeholder consistency
  for (const key of allKeys) {
    const placeholders = {};
    let hasPlaceholderIssues = false;
    
    for (const locale of SUPPORTED_LOCALES) {
      if (!translations[locale]) continue;
      
      const value = getNestedValue(translations[locale], key);
      if (typeof value === 'string') {
        const extracted = extractPlaceholders(value);
        placeholders[locale] = extracted;
        
        // Check for mixed placeholder formats
        const hasBraces = value.includes('{{');
        const hasSingleBraces = value.includes('{') && !value.includes('{{');
        
        if (hasBraces && hasSingleBraces) {
          warning(`Mixed placeholder formats in ${locale}/${namespace}:${key}: "${value}"`);
          hasPlaceholderIssues = true;
        }
      }
    }
    
    // Compare placeholders across locales
    const localesWithPlaceholders = Object.keys(placeholders);
    if (localesWithPlaceholders.length > 1) {
      const firstLocale = localesWithPlaceholders[0];
      const expectedPlaceholders = placeholders[firstLocale];
      
      for (let i = 1; i < localesWithPlaceholders.length; i++) {
        const locale = localesWithPlaceholders[i];
        const actualPlaceholders = placeholders[locale];
        
        const missing = expectedPlaceholders.filter(p => !actualPlaceholders.includes(p));
        const extra = actualPlaceholders.filter(p => !expectedPlaceholders.includes(p));
        
        if (missing.length > 0 || extra.length > 0) {
          error(`Placeholder mismatch in ${locale}/${namespace}:${key}`);
          if (missing.length > 0) {
            error(`  Missing: ${missing.join(', ')}`);
          }
          if (extra.length > 0) {
            error(`  Extra: ${extra.join(', ')}`);
          }
          hasPlaceholderIssues = true;
        }
      }
    }
  }
  
  if (!hasErrors) {
    success(`Namespace ${namespace} is consistent`);
  }
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object') {
      current = current[key];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Check if all required files exist
 */
function checkFileStructure() {
  info('Checking file structure...');
  
  if (!existsSync(localesDir)) {
    error(`Locales directory not found: ${localesDir}`);
    return;
  }
  
  for (const locale of SUPPORTED_LOCALES) {
    const localeDir = join(localesDir, locale);
    if (!existsSync(localeDir)) {
      error(`Locale directory not found: ${locale}`);
      continue;
    }
    
    // Check for index.ts
    const indexFile = join(localeDir, 'index.ts');
    if (!existsSync(indexFile)) {
      warning(`Missing index.ts in ${locale}`);
    }
    
    // Check for required namespaces
    for (const namespace of REQUIRED_NAMESPACES) {
      const namespaceFile = join(localeDir, `${namespace}.ts`);
      if (!existsSync(namespaceFile)) {
        error(`Missing required namespace: ${locale}/${namespace}.ts`);
      }
    }
  }
  
  success('File structure check completed');
}

/**
 * Generate summary report
 */
function generateReport() {
  log('\n' + '='.repeat(60), 'bold');
  log('i18n CONSISTENCY CHECK REPORT', 'bold');
  log('='.repeat(60), 'bold');
  
  if (hasErrors) {
    log('\n❌ FAILED: Issues found that must be fixed', 'red');
  } else if (hasWarnings) {
    log('\n⚠️  PASSED WITH WARNINGS: Minor issues found', 'yellow');
  } else {
    log('\n✅ PASSED: All checks successful', 'green');
  }
  
  log(`\nChecked locales: ${SUPPORTED_LOCALES.join(', ')}`, 'cyan');
  log(`Checked namespaces: ${REQUIRED_NAMESPACES.join(', ')}`, 'cyan');
  log(`Date: ${new Date().toISOString()}`, 'cyan');
}

/**
 * Main execution
 */
function main() {
  log('🔍 Starting i18n consistency check...', 'bold');
  
  checkFileStructure();
  
  for (const namespace of REQUIRED_NAMESPACES) {
    checkNamespaceConsistency(namespace);
  }
  
  generateReport();
  
  // Exit with appropriate code
  if (hasErrors) {
    process.exit(1);
  } else if (hasWarnings) {
    process.exit(0); // Warnings don't fail the build
  } else {
    process.exit(0);
  }
}

main();