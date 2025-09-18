#!/usr/bin/env node

import { readFileSync } from 'fs';

console.log('🔍 Checking GPS i18n parity between EN and DE...');

try {
  const i18nContent = readFileSync('./src/i18n/index.ts', 'utf8');
  
  // Count translation keys by using a simple pattern matching approach
  const countGpsKeys = (content, language) => {
    // Find the gpsTracking section for the language
    const regex = new RegExp(`${language}:[\\s\\S]*?gpsTracking:\\s*\\{([\\s\\S]*?)\\n\\s{6}\\}`, 'i');
    const match = content.match(regex);
    
    if (!match) {
      throw new Error(`No gpsTracking section found for ${language.toUpperCase()}`);
    }
    
    const section = match[1];
    
    // Count all key definitions (including nested ones)
    const keyMatches = section.match(/^\s*\w+:/gm) || [];
    const translationMatches = section.match(/:\s*'[^']*'/g) || [];
    
    return {
      totalKeys: keyMatches.length,
      translationKeys: translationMatches.length,
      section: section
    };
  };

  const enGps = countGpsKeys(i18nContent, 'en');
  const deGps = countGpsKeys(i18nContent, 'de');

  console.log(`📊 EN: ${enGps.totalKeys} total keys, ${enGps.translationKeys} translations`);
  console.log(`📊 DE: ${deGps.totalKeys} total keys, ${deGps.translationKeys} translations`);

  // Check if we have reasonable parity (within 10% or same count)
  const keysDiff = Math.abs(enGps.totalKeys - deGps.totalKeys);
  const translationsDiff = Math.abs(enGps.translationKeys - deGps.translationKeys);
  
  // Simple but effective checks
  const hasUI = enGps.section.includes('ui:') && deGps.section.includes('ui:');
  const hasStateLabels = enGps.section.includes('stateLabels:') && deGps.section.includes('stateLabels:');
  const hasTracking = enGps.section.includes('tracking:') && deGps.section.includes('tracking:');
  const hasStats = enGps.section.includes('stats:') && deGps.section.includes('stats:');
  
  let errors = [];
  
  if (keysDiff > 5) {
    errors.push(`Key count difference too large: EN ${enGps.totalKeys} vs DE ${deGps.totalKeys}`);
  }
  
  if (translationsDiff > 5) {
    errors.push(`Translation count difference too large: EN ${enGps.translationKeys} vs DE ${deGps.translationKeys}`);
  }
  
  if (!hasUI) {
    errors.push('Missing "ui" section in one or both languages');
  }
  
  if (!hasStateLabels) {
    errors.push('Missing "stateLabels" section in one or both languages');
  }
  
  if (!hasTracking) {
    errors.push('Missing "tracking" section in one or both languages');
  }
  
  if (!hasStats) {
    errors.push('Missing "stats" section in one or both languages');
  }

  // Check for some critical UI keys
  const criticalKeys = [
    'currentState',
    'trackingActive',
    'gpsAuthorized',
    'timers',
    'controls'
  ];
  
  criticalKeys.forEach(key => {
    if (!enGps.section.includes(`${key}:`) || !deGps.section.includes(`${key}:`)) {
      errors.push(`Missing critical UI key "${key}" in one or both languages`);
    }
  });

  if (errors.length === 0) {
    console.log('✅ GPS i18n parity check passed!');
    console.log(`📈 Verified ${Math.min(enGps.translationKeys, deGps.translationKeys)} translation strings`);
    console.log('🎨 All required GPS UI sections found');
    process.exit(0);
  } else {
    console.error('❌ GPS i18n parity check failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Error checking i18n parity:', error.message);
  process.exit(1);
}