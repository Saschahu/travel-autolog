#!/usr/bin/env node
/**
 * GPS Status Component Validation Tests
 * Basic validation tests for GPSStatus component structure and i18n usage
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function runTests() {
  console.log('🧪 Running GPS Status Component Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  function test(description, testFn) {
    totalTests++;
    try {
      const result = testFn();
      if (result) {
        console.log(`✅ ${description}`);
        passedTests++;
      } else {
        console.log(`❌ ${description}`);
      }
    } catch (error) {
      console.log(`❌ ${description} - Error: ${error.message}`);
    }
  }
  
  // Read GPS Status component
  const gpsStatusPath = path.join(projectRoot, 'src/components/gps/GPSStatus.tsx');
  const gpsStatusContent = fs.readFileSync(gpsStatusPath, 'utf-8');
  
  // Test 1: Component imports useTranslation
  test('Component imports useTranslation hook', () => {
    return gpsStatusContent.includes("import { useTranslation } from 'react-i18next'");
  });
  
  // Test 2: Component uses t() function
  test('Component uses t() translation function', () => {
    return gpsStatusContent.includes('const { t } = useTranslation()');
  });
  
  // Test 3: Hardcoded German strings are removed
  test('No hardcoded German strings in component', () => {
    const hardcodedStrings = [
      'Aktueller Zustand',
      'Timer',
      'Kontrolle', 
      'Standort-Info',
      'Tracking aktiv',
      'GPS berechtigt',
      'Position abrufen'
    ];
    
    return !hardcodedStrings.some(str => gpsStatusContent.includes(`"${str}"`));
  });
  
  // Test 4: Uses gpsTracking.status translation keys
  test('Uses gpsTracking.status translation namespace', () => {
    return gpsStatusContent.includes("t('gpsTracking.status.") && 
           gpsStatusContent.match(/t\('gpsTracking\.status\./g)?.length >= 10;
  });
  
  // Test 5: ARIA labels are present
  test('Component includes ARIA labels for accessibility', () => {
    return gpsStatusContent.includes('aria-label') && 
           gpsStatusContent.includes('role=') &&
           gpsStatusContent.includes('aria-live');
  });
  
  // Test 6: Badge components have ARIA labels
  test('Badge components have accessibility labels', () => {
    const badgeMatches = gpsStatusContent.match(/<Badge[\s\S]*?aria-label/g);
    return badgeMatches && badgeMatches.length >= 3;
  });
  
  // Test 7: Button components have ARIA labels
  test('Button components have accessibility labels', () => {
    const buttonMatches = gpsStatusContent.match(/<Button[\s\S]*?aria-label/g);
    return buttonMatches && buttonMatches.length >= 5;
  });
  
  // Summary
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All GPS Status tests passed!');
    return true;
  } else {
    console.log(`❌ ${totalTests - passedTests} tests failed`);
    return false;
  }
}

// Run the tests
const success = runTests();
process.exit(success ? 0 : 1);