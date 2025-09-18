#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Extract nested keys from an object with dot notation
 * @param {object} obj - The object to extract keys from
 * @param {string} prefix - Current key prefix
 * @returns {string[]} - Array of dot-notation keys
 */
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
  
  return keys;
}

/**
 * Check i18n parity between languages for a specific namespace
 * @param {string} namespace - The namespace to check (e.g., 'gpsTracking')
 */
function checkI18nParity(namespace = 'gpsTracking') {
  try {
    // Read the i18n file
    const i18nPath = join(projectRoot, 'src/i18n/index.ts');
    const i18nContent = readFileSync(i18nPath, 'utf8');
    
    // Extract the resources object using regex (simplified approach)
    const resourcesMatch = i18nContent.match(/const resources = ({[\s\S]*?});/);
    if (!resourcesMatch) {
      console.error('❌ Could not find resources object in i18n file');
      process.exit(1);
    }
    
    // This is a simplified check - we'll look for the gpsTracking namespace directly
    const gpsTrackingEnMatch = i18nContent.match(/gpsTracking:\s*{([\s\S]*?)}/);
    if (!gpsTrackingEnMatch) {
      console.error(`❌ Could not find ${namespace} namespace in English translations`);
      process.exit(1);
    }
    
    // Count occurrences of key-value pairs in EN and DE sections
    const enSection = i18nContent.match(/en:\s*{[\s\S]*?translation:\s*{([\s\S]*?)},\s*job:/);
    const deSection = i18nContent.match(/de:\s*{[\s\S]*?translation:\s*{([\s\S]*?)},\s*job:/);
    
    if (!enSection || !deSection) {
      console.error('❌ Could not extract EN/DE translation sections');
      process.exit(1);
    }
    
    // Check for gpsTracking namespace in both languages
    const enHasGpsTracking = enSection[1].includes('gpsTracking:');
    const deHasGpsTracking = deSection[1].includes('gpsTracking:');
    
    if (!enHasGpsTracking && !deHasGpsTracking) {
      console.log('✅ No gpsTracking namespace found in either language - parity maintained');
      process.exit(0);
    }
    
    if (enHasGpsTracking && deHasGpsTracking) {
      // Extract gpsTracking blocks from both languages
      const enGpsMatch = enSection[1].match(/gpsTracking:\s*{([\s\S]*?)}\s*(?:,\s*\w+:|$)/);
      const deGpsMatch = deSection[1].match(/gpsTracking:\s*{([\s\S]*?)}\s*(?:,\s*\w+:|$)/);
      
      if (enGpsMatch && deGpsMatch) {
        // Simple key count comparison (more sophisticated parsing would be better)
        const enKeys = (enGpsMatch[1].match(/\w+:/g) || []).length;
        const deKeys = (deGpsMatch[1].match(/\w+:/g) || []).length;
        
        if (enKeys === deKeys && enKeys > 0) {
          console.log(`✅ ${namespace} parity check passed: ${enKeys} keys found in both EN/DE`);
          process.exit(0);
        } else {
          console.error(`❌ ${namespace} parity mismatch: EN has ${enKeys} keys, DE has ${deKeys} keys`);
          process.exit(1);
        }
      }
    }
    
    if (enHasGpsTracking && !deHasGpsTracking) {
      console.error(`❌ ${namespace} exists in EN but missing in DE`);
      process.exit(1);
    }
    
    if (!enHasGpsTracking && deHasGpsTracking) {
      console.error(`❌ ${namespace} exists in DE but missing in EN`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error checking i18n parity:', error.message);
    process.exit(1);
  }
}

// Run the check
const namespace = process.argv[2] || 'gpsTracking';
checkI18nParity(namespace);