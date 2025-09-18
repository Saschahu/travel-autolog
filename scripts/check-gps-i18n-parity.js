#!/usr/bin/env node

/**
 * CI Guard Script: GPS i18n Key Parity Check
 * 
 * This script checks that EN/DE GPS translation keys match exactly
 * in the gps namespace to prevent fallback to key names.
 * 
 * Exits with code 1 if parity is broken, causing CI to fail.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const I18N_FILE = path.join(__dirname, '..', 'src', 'i18n', 'index.ts');

function extractGPSKeys(content, language) {
  // Find the GPS tracking object for the given language
  const langPattern = new RegExp(`${language}\\s*:\\s*{[\\s\\S]*?gpsTracking\\s*:\\s*{([\\s\\S]*?)}[\\s\\S]*?}`);
  const match = content.match(langPattern);
  
  if (!match) {
    return [];
  }
  
  const gpsSection = match[1];
  const keys = [];
  
  // Extract nested keys recursively
  function extractKeys(text, prefix = '') {
    // Match object keys
    const keyPattern = /(\w+)\s*:\s*{/g;
    let keyMatch;
    
    while ((keyMatch = keyPattern.exec(text)) !== null) {
      const key = keyMatch[1];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      keys.push(fullKey);
      
      // Find the corresponding object content
      const startPos = keyMatch.index + keyMatch[0].length;
      let braceCount = 1;
      let endPos = startPos;
      
      while (braceCount > 0 && endPos < text.length) {
        if (text[endPos] === '{') braceCount++;
        if (text[endPos] === '}') braceCount--;
        endPos++;
      }
      
      if (braceCount === 0) {
        const objContent = text.substring(startPos, endPos - 1);
        extractKeys(objContent, fullKey);
      }
    }
    
    // Match simple string keys
    const stringPattern = /(\w+)\s*:\s*['"`][^'"`]*['"`]/g;
    let stringMatch;
    
    while ((stringMatch = stringPattern.exec(text)) !== null) {
      const key = stringMatch[1];
      const fullKey = prefix ? `${prefix}.${key}` : key;
      keys.push(fullKey);
    }
  }
  
  extractKeys(gpsSection);
  return keys.sort();
}

function main() {
  console.log('🔍 Checking GPS i18n key parity...');
  
  if (!fs.existsSync(I18N_FILE)) {
    console.error('❌ i18n file not found:', I18N_FILE);
    process.exit(1);
  }
  
  const content = fs.readFileSync(I18N_FILE, 'utf8');
  
  const enKeys = extractGPSKeys(content, 'en');
  const deKeys = extractGPSKeys(content, 'de');
  
  console.log(`📊 Found ${enKeys.length} EN GPS keys, ${deKeys.length} DE GPS keys`);
  
  // Check for missing keys in English
  const missingInEN = deKeys.filter(key => !enKeys.includes(key));
  
  // Check for missing keys in German  
  const missingInDE = enKeys.filter(key => !deKeys.includes(key));
  
  let hasErrors = false;
  
  if (missingInEN.length > 0) {
    console.error('❌ GPS keys missing in English:');
    missingInEN.forEach(key => console.error(`   - gpsTracking.${key}`));
    hasErrors = true;
  }
  
  if (missingInDE.length > 0) {
    console.error('❌ GPS keys missing in German:');
    missingInDE.forEach(key => console.error(`   - gpsTracking.${key}`));
    hasErrors = true;
  }
  
  if (hasErrors) {
    console.error('');
    console.error('💡 Fix: Add missing GPS translation keys to both EN and DE');
    console.error('    When adding new GPS keys, always add them to both languages simultaneously.');
    process.exit(1);
  }
  
  console.log('✅ GPS i18n key parity check passed!');
  console.log(`   All ${enKeys.length} GPS keys match between EN and DE`);
}

main();