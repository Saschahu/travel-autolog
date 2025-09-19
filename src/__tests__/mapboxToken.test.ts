import { describe, it, expect, beforeEach, vi } from 'vitest';
import { looksLikePublicToken } from '../lib/mapboxToken';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false)
  }
}));

describe('Mapbox Token Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  describe('looksLikePublicToken', () => {
    it('should validate correct public tokens', () => {
      expect(looksLikePublicToken('pk.eyJ1IjoidGVzdCIsImEiOiJjazEyMzQ1NjcifQ')).toBe(true);
      expect(looksLikePublicToken('pk.test123456789')).toBe(true);
    });

    it('should reject invalid tokens', () => {
      expect(looksLikePublicToken('sk.test123')).toBe(false);
      expect(looksLikePublicToken('invalid')).toBe(false);
      expect(looksLikePublicToken('')).toBe(false);
      expect(looksLikePublicToken(undefined)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(looksLikePublicToken('pk.')).toBe(false);
      expect(looksLikePublicToken('pk.abc')).toBe(false); // too short
      expect(looksLikePublicToken('pk.1234567890')).toBe(true); // minimum length
    });
  });
});