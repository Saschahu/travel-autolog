import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('i18n Parity Tests', () => {
  const i18nPath = join(process.cwd(), 'src/i18n/index.ts');
  const i18nContent = readFileSync(i18nPath, 'utf8');

  describe('gpsTracking namespace', () => {
    it('should have gpsTracking namespace in both EN and DE', () => {
      // Check if gpsTracking exists in EN section
      const enSection = i18nContent.match(/en:\s*{[\s\S]*?translation:\s*{([\s\S]*?)},\s*job:/);
      expect(enSection).toBeTruthy();
      expect(enSection![1]).toContain('gpsTracking:');

      // Check if gpsTracking exists in DE section
      const deSection = i18nContent.match(/de:\s*{[\s\S]*?translation:\s*{([\s\S]*?)},\s*job:/);
      expect(deSection).toBeTruthy();
      expect(deSection![1]).toContain('gpsTracking:');
    });

    it('should have ui namespace in both EN and DE gpsTracking', () => {
      // Extract gpsTracking blocks more carefully
      const enGpsMatch = i18nContent.match(/en:[\s\S]*?gpsTracking:\s*{([\s\S]*?)ui:\s*{[\s\S]*?}\s*}/);
      const deGpsMatch = i18nContent.match(/de:[\s\S]*?gpsTracking:\s*{([\s\S]*?)ui:\s*{[\s\S]*?}\s*}/);

      expect(enGpsMatch).toBeTruthy();
      expect(deGpsMatch).toBeTruthy();

      expect(i18nContent).toMatch(/en:[\s\S]*?gpsTracking:[\s\S]*?ui:/);
      expect(i18nContent).toMatch(/de:[\s\S]*?gpsTracking:[\s\S]*?ui:/);
    });

    it('should have states sub-namespace in both EN and DE', () => {
      const enGpsMatch = i18nContent.match(/en:[\s\S]*?gpsTracking:[\s\S]*?ui:\s*{([\s\S]*?)}/);
      const deGpsMatch = i18nContent.match(/de:[\s\S]*?gpsTracking:[\s\S]*?ui:\s*{([\s\S]*?)}/);

      expect(enGpsMatch).toBeTruthy();
      expect(deGpsMatch).toBeTruthy();

      expect(enGpsMatch![1]).toContain('states:');
      expect(deGpsMatch![1]).toContain('states:');
    });

    it('should have all required GPS state translations', () => {
      const requiredStates = [
        'idle_at_home',
        'departing',
        'en_route_to_customer',
        'stationary_check',
        'at_customer',
        'leaving_customer',
        'en_route_home',  
        'stationary_home_check',
        'done'
      ];

      for (const state of requiredStates) {
        // Check EN states
        expect(i18nContent).toMatch(new RegExp(`en:[\\s\\S]*?gpsTracking:[\\s\\S]*?states:[\\s\\S]*?${state}:`));
        // Check DE states  
        expect(i18nContent).toMatch(new RegExp(`de:[\\s\\S]*?gpsTracking:[\\s\\S]*?states:[\\s\\S]*?${state}:`));
      }
    });

    it('should have all required UI labels in both languages', () => {
      const requiredUIKeys = [
        'currentState',
        'timer', 
        'control',
        'locationInfo',
        'travelTime',
        'workTime',
        'returnTime',
        'trackingActive',
        'trackingStopped',
        'gpsPermissionGranted',
        'gpsPermissionMissing',
        'requestGpsPermission',
        'getCurrentPosition',
        'work',
        'private',
        'atCustomer',
        'notAtCustomer',
        'workFinished',
        'continueWorking',
        'tripHomeFinished'
      ];

      for (const key of requiredUIKeys) {
        // Check EN UI keys
        expect(i18nContent).toMatch(new RegExp(`en:[\\s\\S]*?gpsTracking:[\\s\\S]*?ui:[\\s\\S]*?${key}:`));
        // Check DE UI keys
        expect(i18nContent).toMatch(new RegExp(`de:[\\s\\S]*?gpsTracking:[\\s\\S]*?ui:[\\s\\S]*?${key}:`));
      }
    });

    it('should not have any gpsTracking translation keys that return the key itself', () => {
      // This test checks specifically for gpsTracking namespace to avoid false positives
      const gpsTrackingENMatch = i18nContent.match(/en:[\s\S]*?gpsTracking:\s*{([\s\S]*?)}\s*(?:,\s*}\s*,\s*job:|}\s*,\s*job:)/);
      const gpsTrackingDEMatch = i18nContent.match(/de:[\s\S]*?gpsTracking:\s*{([\s\S]*?)}\s*(?:,\s*}\s*,\s*job:|}\s*,\s*job:)/);
      
      expect(gpsTrackingENMatch).toBeTruthy();
      expect(gpsTrackingDEMatch).toBeTruthy();
      
      const enGpsContent = gpsTrackingENMatch![1];
      const deGpsContent = gpsTrackingDEMatch![1];
      
      // Check EN gpsTracking keys
      const enKeyPattern = /(\w+):\s*'([^']+)'/g;
      let enMatch;
      while ((enMatch = enKeyPattern.exec(enGpsContent)) !== null) {
        const [, key, value] = enMatch;
        expect(value).not.toBe(key);
      }
      
      // Check DE gpsTracking keys  
      const deKeyPattern = /(\w+):\s*'([^']+)'/g;
      let deMatch;
      while ((deMatch = deKeyPattern.exec(deGpsContent)) !== null) {
        const [, key, value] = deMatch;
        expect(value).not.toBe(key);
      }
    });
  });

  describe('Translation completeness', () => {
    it('should have startTracking and stopTracking keys in root translation', () => {
      // These are used by the GPSStatus component
      expect(i18nContent).toMatch(/en:[\s\S]*?startTracking:/);
      expect(i18nContent).toMatch(/de:[\s\S]*?startTracking:/);
      expect(i18nContent).toMatch(/en:[\s\S]*?stopTracking:/);
      expect(i18nContent).toMatch(/de:[\s\S]*?stopTracking:/);
    });

    it('should have consistent structure between EN and DE', () => {
      // Both languages should have the same major sections
      const enSections = i18nContent.match(/en:\s*{[\s\S]*?translation:\s*{([\s\S]*?)},\s*job:/);
      const deSections = i18nContent.match(/de:\s*{[\s\S]*?translation:\s*{([\s\S]*?)},\s*job:/);

      expect(enSections).toBeTruthy();
      expect(deSections).toBeTruthy();

      // Both should have gpsTracking
      expect(enSections![1]).toContain('gpsTracking:');
      expect(deSections![1]).toContain('gpsTracking:');
    });
  });
});