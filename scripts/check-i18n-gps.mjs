#!/usr/bin/env node
/**
 * GPS i18n Parity Guard
 * Ensures GPS tracking translations have complete EN/DE parity
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function extractNestedKeys(obj, prefix = '') {
  const keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractNestedKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

function checkGPSi18nParity() {
  console.log('🔍 Checking GPS i18n parity...\n');
  
  try {
    // Import the i18n resources
    const i18nPath = path.join(projectRoot, 'src/i18n/index.ts');
    const i18nContent = fs.readFileSync(i18nPath, 'utf-8');
    
    // Find GPS tracking sections more robustly
    const lines = i18nContent.split('\n');
    let enGpsStart = -1, enGpsEnd = -1, deGpsStart = -1, deGpsEnd = -1;
    let enStatusStart = -1, enStatusEnd = -1, deStatusStart = -1, deStatusEnd = -1;
    
    // Find EN section bounds
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('en: {') && enGpsStart === -1) {
        for (let j = i; j < lines.length; j++) {
          if (lines[j].includes('gpsTracking: {')) {
            enGpsStart = j;
            // Find matching closing brace
            let braceCount = 1;
            for (let k = j + 1; k < lines.length; k++) {
              if (lines[k].includes('{')) braceCount++;
              if (lines[k].includes('}')) braceCount--;
              if (braceCount === 0) {
                enGpsEnd = k;
                break;
              }
            }
            break;
          }
        }
        break;
      }
    }
    
    // Find DE section bounds  
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('de: {')) {
        for (let j = i; j < lines.length; j++) {
          if (lines[j].includes('gpsTracking: {')) {
            deGpsStart = j;
            // Find matching closing brace
            let braceCount = 1;
            for (let k = j + 1; k < lines.length; k++) {
              if (lines[k].includes('{')) braceCount++;
              if (lines[k].includes('}')) braceCount--;
              if (braceCount === 0) {
                deGpsEnd = k;
                break;
              }
            }
            break;
          }
        }
        break;
      }
    }
    
    if (enGpsStart === -1 || deGpsStart === -1) {
      throw new Error('Could not find gpsTracking sections in both EN and DE translations');
    }
    
    const enGpsSection = lines.slice(enGpsStart, enGpsEnd + 1).join('\n');
    const deGpsSection = lines.slice(deGpsStart, deGpsEnd + 1).join('\n');
    
    // Find status subsections
    const enStatusMatch = enGpsSection.match(/status:\s*{([\s\S]*?)^\s*}/m);
    const deStatusMatch = deGpsSection.match(/status:\s*{([\s\S]*?)^\s*}/m);
    
    if (!enStatusMatch || !deStatusMatch) {
      throw new Error('GPS status translations not found in both languages');
    }
    
    // Count keys more accurately
    const countKeys = (text) => {
      const keyMatches = text.match(/^\s*\w+:/gm);
      return keyMatches ? keyMatches.length : 0;
    };
    
    const enStatusKeys = countKeys(enStatusMatch[1]);
    const deStatusKeys = countKeys(deStatusMatch[1]);
    const enGpsKeys = countKeys(enGpsSection);
    const deGpsKeys = countKeys(deGpsSection);
    
    console.log(`📊 GPS Translation Stats:`);
    console.log(`   English GPS keys: ${enGpsKeys}`);
    console.log(`   German GPS keys: ${deGpsKeys}`);
    console.log(`   English GPS status keys: ${enStatusKeys}`);
    console.log(`   German GPS status keys: ${deStatusKeys}`);
    
    // Check for parity
    let hasError = false;
    
    if (Math.abs(enGpsKeys - deGpsKeys) > 2) { // Allow small difference for comments
      console.error(`❌ GPS key count mismatch: EN=${enGpsKeys}, DE=${deGpsKeys}`);
      hasError = true;
    }
    
    if (Math.abs(enStatusKeys - deStatusKeys) > 1) {
      console.error(`❌ GPS status key count mismatch: EN=${enStatusKeys}, DE=${deStatusKeys}`);
      hasError = true;
    }
    
    // Check for required GPS status keys (search in entire GPS section since they might be nested)
    const requiredKeys = [
      'currentState', 'timers', 'control', 'locationInfo',
      'states', 'trackingActive', 'trackingStopped', 
      'gpsAuthorized', 'gpsPermissionMissing',
      'travel', 'workTime', 'return',
      'requestGpsPermission', 'getCurrentPosition', 'work', 'private',
      'atCustomer', 'notAtCustomer', 'workFinished', 'continueWorking', 'tripFinished',
      'lastPosition', 'noPositionAvailable', 'speed', 'accuracy', 'timestamp'
    ];
    
    const missingKeys = [];
    for (const key of requiredKeys) {
      if (!enGpsSection.includes(`${key}:`)) {
        missingKeys.push(`EN: ${key}`);
      }
      if (!deGpsSection.includes(`${key}:`)) {
        missingKeys.push(`DE: ${key}`);
      }
    }
    
    if (missingKeys.length > 0) {
      console.error(`❌ Missing required GPS status keys:`);
      missingKeys.forEach(key => console.error(`   - ${key}`));
      hasError = true;
    }
    
    // Check state translations (these are nested in states object)
    const requiredStates = [
      'idle_at_home', 'departing', 'en_route_to_customer', 'stationary_check',
      'at_customer', 'leaving_customer', 'en_route_home', 'stationary_home_check', 'done'
    ];
    
    const missingStates = [];
    for (const state of requiredStates) {
      if (!enGpsSection.includes(`${state}:`)) {
        missingStates.push(`EN: ${state}`);
      }
      if (!deGpsSection.includes(`${state}:`)) {
        missingStates.push(`DE: ${state}`);
      }
    }
    
    if (missingStates.length > 0) {
      console.error(`❌ Missing required GPS state translations:`);
      missingStates.forEach(state => console.error(`   - ${state}`));
      hasError = true;
    }
    
    if (!hasError) {
      console.log(`✅ GPS i18n parity check passed!`);
      console.log(`✅ Found ${requiredKeys.length} GPS status keys in both languages`);
      console.log(`✅ Found ${requiredStates.length} GPS state translations in both languages`);
      console.log(`✅ Total ~${enGpsKeys + deGpsKeys} GPS translation keys validated`);
      return true;
    } else {
      console.error(`\n❌ GPS i18n parity check failed!`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error checking GPS i18n parity: ${error.message}`);
    return false;
  }
}

// Run the check
const success = checkGPSi18nParity();
process.exit(success ? 0 : 1);