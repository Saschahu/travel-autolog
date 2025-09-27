import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getFlag,
  getAllFlags,
  setLocalOverride,
  clearLocalOverride,
  clearAllLocalOverrides,
  getFlagSource,
  getFlagMeta,
  FLAG_REGISTRY,
  initializeFlags,
  applyRemoteConfig
} from '../flags';

// Mock IndexedDB and localStorage
const mockStorage = new Map<string, any>();

global.localStorage = {
  getItem: (key: string) => mockStorage.get(`localStorage_${key}`) || null,
  setItem: (key: string, value: string) => mockStorage.set(`localStorage_${key}`, value),
  removeItem: (key: string) => mockStorage.delete(`localStorage_${key}`),
  clear: () => {
    Array.from(mockStorage.keys())
      .filter(key => key.startsWith('localStorage_'))
      .forEach(key => mockStorage.delete(key));
  },
  length: 0,
  key: () => null
} as Storage;

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => mockStorage.get(`idb_${key}`)),
  set: vi.fn(async (key: string, value: any) => mockStorage.set(`idb_${key}`, value)),
  del: vi.fn(async (key: string) => mockStorage.delete(`idb_${key}`))
}));

describe('Feature Flags', () => {
  beforeEach(() => {
    mockStorage.clear();
    clearAllLocalOverrides();
  });

  describe('Flag Registry', () => {
    it('should have all required flags in registry', () => {
      expect(FLAG_REGISTRY['gps.enhancedTelemetry']).toBeDefined();
      expect(FLAG_REGISTRY['ui.experimentalPdf']).toBeDefined();
      expect(FLAG_REGISTRY['perf.deferHeavyImports']).toBeDefined();
      expect(FLAG_REGISTRY['security.strictCSP']).toBeDefined();
      expect(FLAG_REGISTRY['export.excelV2']).toBeDefined();
    });

    it('should have proper flag definitions', () => {
      const flag = FLAG_REGISTRY['gps.enhancedTelemetry'];
      expect(flag.key).toBe('gps.enhancedTelemetry');
      expect(typeof flag.default).toBe('boolean');
      expect(flag.description).toBeTruthy();
      expect(flag.since).toBeTruthy();
    });
  });

  describe('Basic Flag Access', () => {
    it('should return default values for flags', () => {
      expect(getFlag('gps.enhancedTelemetry')).toBe(false);
      expect(getFlag('ui.experimentalPdf')).toBe(false);
      expect(getFlag('perf.deferHeavyImports')).toBe(true);
      expect(getFlag('security.strictCSP')).toBe(true);
      expect(getFlag('export.excelV2')).toBe(false);
    });

    it('should return false for unknown flags', () => {
      expect(getFlag('unknown.flag')).toBe(false);
    });

    it('should return all flags', () => {
      const allFlags = getAllFlags();
      expect(Object.keys(allFlags)).toHaveLength(5);
      expect(allFlags['gps.enhancedTelemetry']).toBe(false);
      expect(allFlags['perf.deferHeavyImports']).toBe(true);
    });
  });

  describe('Local Overrides', () => {
    it('should allow setting local overrides', () => {
      setLocalOverride('gps.enhancedTelemetry', true);
      expect(getFlag('gps.enhancedTelemetry')).toBe(true);
      expect(getFlagSource('gps.enhancedTelemetry')).toBe('local');
    });

    it('should allow clearing individual overrides', () => {
      setLocalOverride('gps.enhancedTelemetry', true);
      expect(getFlag('gps.enhancedTelemetry')).toBe(true);
      
      clearLocalOverride('gps.enhancedTelemetry');
      expect(getFlag('gps.enhancedTelemetry')).toBe(false);
      expect(getFlagSource('gps.enhancedTelemetry')).toBe('default');
    });

    it('should allow clearing all overrides', () => {
      setLocalOverride('gps.enhancedTelemetry', true);
      setLocalOverride('ui.experimentalPdf', true);
      
      expect(getFlag('gps.enhancedTelemetry')).toBe(true);
      expect(getFlag('ui.experimentalPdf')).toBe(true);
      
      clearAllLocalOverrides();
      
      expect(getFlag('gps.enhancedTelemetry')).toBe(false);
      expect(getFlag('ui.experimentalPdf')).toBe(false);
    });

    it('should handle different value types', () => {
      // For string/number flags, we can test with different values
      setLocalOverride('gps.enhancedTelemetry', true);
      expect(getFlag('gps.enhancedTelemetry')).toBe(true);
      
      // Test invalid flag key warning
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      setLocalOverride('invalid.flag', true);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown flag key: invalid.flag');
      consoleSpy.mockRestore();
    });
  });

  describe('Flag Sources', () => {
    it('should correctly identify flag sources', () => {
      // Default source
      expect(getFlagSource('gps.enhancedTelemetry')).toBe('default');
      
      // Local override source
      setLocalOverride('gps.enhancedTelemetry', true);
      expect(getFlagSource('gps.enhancedTelemetry')).toBe('local');
    });
  });

  describe('Remote Config Application', () => {
    it('should apply remote config correctly', async () => {
      const remoteFlags = {
        'gps.enhancedTelemetry': true,
        'ui.experimentalPdf': true
      };
      
      await applyRemoteConfig(remoteFlags);
      
      expect(getFlag('gps.enhancedTelemetry')).toBe(true);
      expect(getFlag('ui.experimentalPdf')).toBe(true);
      expect(getFlagSource('gps.enhancedTelemetry')).toBe('remote');
      expect(getFlagSource('ui.experimentalPdf')).toBe('remote');
    });

    it('should prioritize local overrides over remote config', async () => {
      // Set local override first
      setLocalOverride('gps.enhancedTelemetry', false);

      // Apply remote config that tries to set it to true
      const remoteFlags = {
        'gps.enhancedTelemetry': true
      };

      await applyRemoteConfig(remoteFlags);

      // Local override should win
      expect(getFlag('gps.enhancedTelemetry')).toBe(false);
      expect(getFlagSource('gps.enhancedTelemetry')).toBe('local');
    });

    it('should restore defaults when clearing overrides after remote config', async () => {
      const remoteFlags = {
        'gps.enhancedTelemetry': true
      };

      await applyRemoteConfig(remoteFlags);
      expect(getFlag('gps.enhancedTelemetry')).toBe(true);
      expect(getFlagSource('gps.enhancedTelemetry')).toBe('remote');

      setLocalOverride('gps.enhancedTelemetry', false);
      expect(getFlag('gps.enhancedTelemetry')).toBe(false);
      expect(getFlagSource('gps.enhancedTelemetry')).toBe('local');

      clearLocalOverride('gps.enhancedTelemetry');

      expect(getFlag('gps.enhancedTelemetry')).toBe(false);
      expect(getFlagSource('gps.enhancedTelemetry')).toBe('default');
    });
  });

  describe('Flag Metadata', () => {
    it('should return flag metadata', () => {
      const meta = getFlagMeta('gps.enhancedTelemetry');
      expect(meta).toBeDefined();
      expect(meta!.key).toBe('gps.enhancedTelemetry');
      expect(meta!.default).toBe(false);
      expect(meta!.description).toBeTruthy();
    });

    it('should return undefined for unknown flags', () => {
      expect(getFlagMeta('unknown.flag')).toBeUndefined();
    });
  });
});