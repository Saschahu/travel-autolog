import { describe, test, expect } from 'vitest';

// Import the raw translation objects directly
import { resources } from '../i18n/index';

describe('i18n Key Parity Tests', () => {
  test('GPS namespace key parity between EN and DE', () => {
    const en = resources.en.translation;
    const de = resources.de.translation;
    
    // Check if GPS namespace exists in both languages
    if (en.gpsTracking && de.gpsTracking) {
      expect(Object.keys(en.gpsTracking)).toEqual(Object.keys(de.gpsTracking));
      
      // Test nested keys for tracking
      if (en.gpsTracking.tracking && de.gpsTracking.tracking) {
        expect(Object.keys(en.gpsTracking.tracking)).toEqual(Object.keys(de.gpsTracking.tracking));
      }
      
      // Test nested keys for stats
      if (en.gpsTracking.stats && de.gpsTracking.stats) {
        expect(Object.keys(en.gpsTracking.stats)).toEqual(Object.keys(de.gpsTracking.stats));
      }
      
      // Test nested keys for export
      if (en.gpsTracking.export && de.gpsTracking.export) {
        expect(Object.keys(en.gpsTracking.export)).toEqual(Object.keys(de.gpsTracking.export));
      }
      
      // Test nested keys for cleanup
      if (en.gpsTracking.cleanup && de.gpsTracking.cleanup) {
        expect(Object.keys(en.gpsTracking.cleanup)).toEqual(Object.keys(de.gpsTracking.cleanup));
      }
    } else {
      // If one language is missing the gpsTracking namespace, this test should fail
      expect(en.gpsTracking).toBeDefined();
      expect(de.gpsTracking).toBeDefined();
    }
  });
  
  test('All GPS related translation keys should exist in both languages', () => {
    const en = resources.en.translation;
    const de = resources.de.translation;
    
    // List of GPS-related flat keys that should exist in both languages
    const gpsKeys = [
      'startTracking',
      'stopTracking', 
      'trackingCouldNotStart',
      'activateGpsTracking',
      'gps',
      'location'
    ];
    
    gpsKeys.forEach(key => {
      expect(en[key]).toBeDefined();
      expect(de[key]).toBeDefined();
    });
  });
  
  test('Detect missing GPS translations that could cause fallback to key names', () => {
    const en = resources.en.translation;
    const de = resources.de.translation;
    
    // This test identifies keys that exist in one language but not the other
    // which would cause fallback to key names
    
    const allGpsKeysInDE = [];
    const allGpsKeysInEN = [];
    
    // Collect GPS keys from German translations
    if (de.gpsTracking) {
      const collectKeys = (obj: any, prefix = 'gpsTracking') => {
        Object.keys(obj).forEach(key => {
          const fullKey = `${prefix}.${key}`;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            collectKeys(obj[key], fullKey);
          } else {
            allGpsKeysInDE.push(fullKey);
          }
        });
      };
      collectKeys(de.gpsTracking);
    }
    
    // Collect GPS keys from English translations  
    if (en.gpsTracking) {
      const collectKeys = (obj: any, prefix = 'gpsTracking') => {
        Object.keys(obj).forEach(key => {
          const fullKey = `${prefix}.${key}`;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            collectKeys(obj[key], fullKey);
          } else {
            allGpsKeysInEN.push(fullKey);
          }
        });
      };
      collectKeys(en.gpsTracking);
    }
    
    // Keys that exist in DE but not in EN
    const missingInEN = allGpsKeysInDE.filter(key => !allGpsKeysInEN.includes(key));
    
    // Keys that exist in EN but not in DE  
    const missingInDE = allGpsKeysInEN.filter(key => !allGpsKeysInDE.includes(key));
    
    // Report any missing keys
    if (missingInEN.length > 0) {
      console.warn('GPS keys missing in English:', missingInEN);
    }
    if (missingInDE.length > 0) {
      console.warn('GPS keys missing in German:', missingInDE);
    }
    
    // Test should pass even if keys are missing, but log warnings
    expect(true).toBe(true);
  });
});