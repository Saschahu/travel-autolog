import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requestPermission, getCurrent, isSecureWebContext } from './geolocation';

// Mock Capacitor
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false)
  }
}));

vi.mock('@capacitor/geolocation', () => ({
  Geolocation: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    getCurrentPosition: vi.fn()
  }
}));

describe('geolocation service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSecureWebContext', () => {
    it('should return a boolean', () => {
      const result = isSecureWebContext();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('requestPermission', () => {
    it('should return "prompt" for web platform', async () => {
      const { Capacitor } = await import('@capacitor/core');
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      
      const result = await requestPermission();
      expect(result).toBe('prompt');
    });

    it('should handle native platform permissions', async () => {
      const { Capacitor } = await import('@capacitor/core');
      const { Geolocation } = await import('@capacitor/geolocation');
      
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(Geolocation.checkPermissions).mockResolvedValue({
        location: 'granted',
        coarseLocation: 'granted'
      });
      
      const result = await requestPermission();
      expect(result).toBe('granted');
    });
  });

  describe('getCurrent', () => {
    it('should handle web geolocation success', async () => {
      const { Capacitor } = await import('@capacitor/core');
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

      const mockPosition = {
        coords: {
          latitude: 52.5200,
          longitude: 13.4050,
          accuracy: 10,
          speed: null
        },
        timestamp: Date.now()
      };

      const mockGetCurrentPosition = vi.fn((success) => {
        success(mockPosition);
      });

      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: mockGetCurrentPosition
        },
        writable: true
      });

      const result = await getCurrent();
      
      expect(result).toEqual({
        lat: 52.5200,
        lng: 13.4050,
        accuracy: 10,
        speed: null,
        ts: mockPosition.timestamp
      });
    });

    it('should handle web geolocation error', async () => {
      const { Capacitor } = await import('@capacitor/core');
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

      const mockGetCurrentPosition = vi.fn((success, error) => {
        error(new Error('Location not available'));
      });

      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: mockGetCurrentPosition
        },
        writable: true
      });

      await expect(getCurrent()).rejects.toThrow('Location not available');
    });

    it('should handle native platform geolocation', async () => {
      const { Capacitor } = await import('@capacitor/core');
      const { Geolocation } = await import('@capacitor/geolocation');
      
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      
      const mockPosition = {
        coords: {
          latitude: 52.5200,
          longitude: 13.4050,
          accuracy: 10,
          speed: 5
        },
        timestamp: Date.now()
      };
      
      vi.mocked(Geolocation.getCurrentPosition).mockResolvedValue(mockPosition);
      
      const result = await getCurrent();
      
      expect(result).toEqual({
        lat: 52.5200,
        lng: 13.4050,
        accuracy: 10,
        speed: 5,
        ts: mockPosition.timestamp
      });
    });
  });
});