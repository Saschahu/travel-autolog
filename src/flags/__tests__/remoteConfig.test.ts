import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock import.meta.env at the top level
const mockEnv = {
  VITE_CONFIG_URL: 'https://example.com/config.json'
};

vi.mock('import.meta', () => ({
  env: mockEnv
}));

import { fetchRemoteConfig, isStale, getLastFetchTime, formatLastFetchTime } from '../remoteConfig';

// Mock the flags module
const mockApplyRemoteConfig = vi.fn();
vi.mock('../flags', () => ({
  FLAG_REGISTRY: {
    'gps.enhancedTelemetry': {
      key: 'gps.enhancedTelemetry',
      default: false,
      description: 'Test flag',
      since: '2024-01-01'
    },
    'ui.experimentalPdf': {
      key: 'ui.experimentalPdf',
      default: false,
      description: 'Test flag',
      since: '2024-01-01'
    }
  },
  applyRemoteConfig: mockApplyRemoteConfig
}));

// Mock localStorage
const mockStorage = new Map<string, string>();
global.localStorage = {
  getItem: (key: string) => mockStorage.get(key) || null,
  setItem: (key: string, value: string) => mockStorage.set(key, value),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  length: 0,
  key: () => null
} as Storage;

// Mock fetch
global.fetch = vi.fn();

describe('Remote Config', () => {
  beforeEach(() => {
    mockStorage.clear();
    mockEnv.VITE_CONFIG_URL = 'https://example.com/config.json';
    vi.clearAllMocks();
  });

  describe('isStale', () => {
    it('should return true when no last fetch time exists', () => {
      expect(isStale()).toBe(true);
    });

    it('should return true when last fetch is older than max age', () => {
      const oldTime = Date.now() - 2 * 24 * 60 * 60 * 1000; // 2 days ago
      mockStorage.set('travel_flags_last_fetch', oldTime.toString());
      
      expect(isStale(24 * 60 * 60 * 1000)).toBe(true); // 1 day max age
    });

    it('should return false when last fetch is within max age', () => {
      const recentTime = Date.now() - 12 * 60 * 60 * 1000; // 12 hours ago
      mockStorage.set('travel_flags_last_fetch', recentTime.toString());
      
      expect(isStale(24 * 60 * 60 * 1000)).toBe(false); // 1 day max age
    });

    it('should handle localStorage errors gracefully', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      
      expect(isStale()).toBe(true);
      
      localStorage.getItem = originalGetItem;
    });
  });

  describe('getLastFetchTime', () => {
    it('should return null when no last fetch time exists', () => {
      expect(getLastFetchTime()).toBeNull();
    });

    it('should return the last fetch time as number', () => {
      const timestamp = Date.now();
      mockStorage.set('travel_flags_last_fetch', timestamp.toString());
      
      expect(getLastFetchTime()).toBe(timestamp);
    });

    it('should handle localStorage errors gracefully', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });
      
      expect(getLastFetchTime()).toBeNull();
      
      localStorage.getItem = originalGetItem;
    });
  });

  describe('formatLastFetchTime', () => {
    it('should return "Never" when no last fetch time exists', () => {
      expect(formatLastFetchTime()).toBe('Never');
    });

    it('should format the last fetch time', () => {
      const timestamp = Date.now();
      mockStorage.set('travel_flags_last_fetch', timestamp.toString());
      
      const formatted = formatLastFetchTime();
      expect(formatted).not.toBe('Never');
      expect(formatted).toContain('/'); // Should contain date separators
    });
  });

  describe('fetchRemoteConfig', () => {
    it('should return false when no VITE_CONFIG_URL is configured', async () => {
      mockEnv.VITE_CONFIG_URL = '';
      
      const result = await fetchRemoteConfig();
      expect(result).toBe(false);
    });

    it('should fetch and apply valid remote config', async () => {
      const mockResponse = {
        flags: {
          'gps.enhancedTelemetry': true,
          'ui.experimentalPdf': false
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => mockResponse
      });

      const result = await fetchRemoteConfig();
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/config.json',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Cache-Control': 'no-store'
          }),
          credentials: 'omit'
        })
      );
    });

    it('should handle HTTP errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      const result = await fetchRemoteConfig();
      expect(result).toBe(false);
    });

    it('should handle invalid JSON gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      const result = await fetchRemoteConfig();
      expect(result).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchRemoteConfig();
      expect(result).toBe(false);
    });

    it('should validate and filter invalid flags', async () => {
      const mockResponse = {
        flags: {
          'gps.enhancedTelemetry': true,
          'ui.experimentalPdf': 'invalid_type', // Wrong type
          'unknown.flag': true, // Unknown flag
          'ui.experimentalPdf': false // Valid
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => mockResponse
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = await fetchRemoteConfig();
      
      expect(result).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown flag key ignored: unknown.flag');
      consoleSpy.mockRestore();
    });

    it('should reject invalid response format', async () => {
      const mockResponse = {
        // Missing flags property
        version: '1.0'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => mockResponse
      });

      const result = await fetchRemoteConfig();
      expect(result).toBe(false);
    });

    it('should reject non-JSON content type', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'text/html' : null
        }
      });

      const result = await fetchRemoteConfig();
      expect(result).toBe(false);
    });

    it('should update last fetch timestamp on success', async () => {
      const mockResponse = {
        flags: {
          'gps.enhancedTelemetry': true
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: (name: string) => name === 'content-type' ? 'application/json' : null
        },
        json: async () => mockResponse
      });

      const beforeTime = Date.now();
      await fetchRemoteConfig();
      const afterTime = Date.now();

      const lastFetch = getLastFetchTime();
      expect(lastFetch).toBeGreaterThanOrEqual(beforeTime);
      expect(lastFetch).toBeLessThanOrEqual(afterTime);
    });
  });
});