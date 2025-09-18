#!/usr/bin/env node

/**
 * I18n Parity Guard for GPS Status Component
 * Ensures all German GPS status translations have English equivalents
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const i18nPath = resolve('./src/i18n/index.ts');

try {
  const content = readFileSync(i18nPath, 'utf8');
  
  // Extract GPS status translations for EN and DE
  const englishMatch = content.match(/en:\s*\{[\s\S]*?gpsStatus:\s*\{([\s\S]*?)\}\s*,/);
  const germanMatch = content.match(/de:\s*\{[\s\S]*?gpsStatus:\s*\{([\s\S]*?)\}\s*,/);
  
  if (!englishMatch || !germanMatch) {
    console.error('❌ GPS status translations not found in both languages');
    process.exit(1);
  }
  
  const englishContent = englishMatch[1];
  const germanContent = germanMatch[1];
  
  // Extract all translation keys
  const extractKeys = (content) => {
    const keys = new Set();
    const keyPattern = /(\w+):\s*['"]/g;
    let match;
    while ((match = keyPattern.exec(content)) !== null) {
      keys.add(match[1]);
    }
    return keys;
  };
  
  const englishKeys = extractKeys(englishContent);
  const germanKeys = extractKeys(germanContent);
  
  // Check for missing keys
  const missingInEnglish = [...germanKeys].filter(key => !englishKeys.has(key));
  const missingInGerman = [...englishKeys].filter(key => !germanKeys.has(key));
  
  let hasErrors = false;
  
  if (missingInEnglish.length > 0) {
    console.error('❌ Missing GPS status keys in English:');
    missingInEnglish.forEach(key => console.error(`  - ${key}`));
    hasErrors = true;
  }
  
  if (missingInGerman.length > 0) {
    console.error('❌ Missing GPS status keys in German:');
    missingInGerman.forEach(key => console.error(`  - ${key}`));
    hasErrors = true;
  }
  
  if (hasErrors) {
    console.error(`❌ GPS i18n parity check failed: ${missingInEnglish.length + missingInGerman.length} missing translations`);
    process.exit(1);
  }
  
  const totalKeys = englishKeys.size;
  console.log(`✅ GPS i18n parity check passed: ${totalKeys} strings in both EN/DE`);
  
} catch (error) {
  console.error('❌ Failed to check GPS i18n parity:', error.message);
  process.exit(1);
}