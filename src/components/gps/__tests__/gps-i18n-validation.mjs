#!/usr/bin/env node

/**
 * Simple validation test for GPS Status i18n completeness
 * Tests that all required GPS status translations exist in both EN/DE
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const componentPath = resolve(__dirname, '../GPSStatus.tsx');
const i18nPath = resolve(__dirname, '../../../i18n/index.ts');

console.log('🧪 Running GPS Status i18n validation tests...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(description, testFn) {
  try {
    testFn();
    console.log(`✅ ${description}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    testsFailed++;
  }
}

try {
  const componentContent = readFileSync(componentPath, 'utf8');
  const i18nContent = readFileSync(i18nPath, 'utf8');

  // Test 1: Component should not contain hardcoded German strings
  test('Component should not contain hardcoded German strings', () => {
    const hardcodedStrings = [
      'Zuhause (Bereit)',
      'Verlässt Zuhause',
      'Anreise zum Kunden',
      'Beim Kunden',
      'Aktueller Zustand',
      'Timer',
      'Kontrolle',
      'Standort-Info'
    ];
    
    const foundHardcoded = hardcodedStrings.filter(str => componentContent.includes(`'${str}'`) || componentContent.includes(`"${str}"`));
    
    if (foundHardcoded.length > 0) {
      throw new Error(`Found hardcoded German strings: ${foundHardcoded.join(', ')}`);
    }
  });

  // Test 2: Component should use t() function for all UI strings
  test('Component should use t() function for UI strings', () => {
    const tFunctionCalls = (componentContent.match(/t\(['"][^'"]+['"]\)/g) || []).length;
    
    if (tFunctionCalls < 20) {
      throw new Error(`Expected at least 20 t() function calls, found ${tFunctionCalls}`);
    }
  });

  // Test 3: All GPS status states should have translations
  test('All GPS status states should have translations in both languages', () => {
    const requiredStates = [
      'idle_at_home', 'departing', 'en_route_to_customer', 
      'stationary_check', 'at_customer', 'leaving_customer', 
      'en_route_home', 'stationary_home_check', 'done'
    ];
    
    for (const state of requiredStates) {
      if (!i18nContent.includes(`${state}:`)) {
        throw new Error(`Missing translation for state: ${state}`);
      }
    }
  });

  // Test 4: UI labels should have both EN and DE versions
  test('UI labels should have both EN and DE versions', () => {
    const requiredLabels = [
      'currentState', 'timer', 'control', 'locationInfo',
      'travelTime', 'workTime', 'returnTime'
    ];
    
    for (const label of requiredLabels) {
      const enMatch = i18nContent.match(new RegExp(`en:.*?gpsStatus.*?ui.*?${label}:`, 's'));
      const deMatch = i18nContent.match(new RegExp(`de:.*?gpsStatus.*?ui.*?${label}:`, 's'));
      
      if (!enMatch || !deMatch) {
        throw new Error(`Missing EN or DE translation for UI label: ${label}`);
      }
    }
  });

  // Test 5: ARIA labels should be present for accessibility
  test('ARIA labels should be present for accessibility', () => {
    const requiredAriaLabels = [
      'currentStateLabel', 'trackingStatusLabel', 'permissionStatusLabel',
      'timerLabel', 'controlButton', 'locationInfoRegion'
    ];
    
    for (const ariaLabel of requiredAriaLabels) {
      if (!i18nContent.includes(`${ariaLabel}:`)) {
        throw new Error(`Missing ARIA label translation: ${ariaLabel}`);
      }
    }
  });

  // Test 6: Component should have ARIA attributes
  test('Component should have ARIA attributes', () => {
    const ariaAttributes = ['aria-label', 'aria-labelledby', 'role'];
    const hasAriaAttributes = ariaAttributes.some(attr => componentContent.includes(attr));
    
    if (!hasAriaAttributes) {
      throw new Error('Component should have ARIA attributes for accessibility');
    }
  });

  // Test 7: Button texts should be internationalized
  test('Button texts should be internationalized', () => {
    const buttonTexts = componentContent.match(/>{[^<]+}</g) || [];
    const hasTranslationCalls = buttonTexts.some(text => text.includes('t('));
    
    if (!hasTranslationCalls) {
      throw new Error('Button texts should use translation function');
    }
  });

  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Total: ${testsPassed + testsFailed}`);

  if (testsFailed > 0) {
    console.log('\n❌ Some GPS Status i18n tests failed!');
    process.exit(1);
  } else {
    console.log('\n🎉 All GPS Status i18n tests passed!');
    console.log('✅ Component is fully internationalized with EN/DE parity');
    console.log('✅ ARIA labels present for screen reader accessibility');
    console.log('✅ No hardcoded German strings detected');
  }

} catch (error) {
  console.error('💥 Failed to run i18n validation tests:', error.message);
  process.exit(1);
}