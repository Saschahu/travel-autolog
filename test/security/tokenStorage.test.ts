import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateMapboxToken,
  isValidMapboxToken,
  writeTokenToIDB,
  readTokenFromIDB,
  migrateLocalStorageToIDB,
  setCookieMode,
  isCookieMode,
  probeSessionURL
} from '../../src/security/tokenStorage';

describe('tokenStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCookieMode(false);
  });

  describe('Mapbox token validation', () => {
    it('should accept valid Mapbox tokens', () => {
      const validTokens = [
        'pk.eyJ1IjoidGVzdCIsImEiOiJjbDEyMzQ1NjcifQ.test',
        'pk.abc123_def-456.ghi789',
        'pk.1234567890abcdef'
      ];

      validTokens.forEach(token => {
        expect(validateMapboxToken(token)).toBe(true);
        expect(isValidMapboxToken(token)).toBe(true);
      });
    });

    it('should reject invalid Mapbox tokens', () => {
      const invalidTokens = [
        undefined,
        null,
        '',
        'sk.invalid',
        'pk.',
        'pk.abc',
        'not-a-token',
        'pk.abc@invalid'
      ];

      invalidTokens.forEach(token => {
        expect(validateMapboxToken(token as string)).toBe(false);
        expect(isValidMapboxToken(token as string)).toBe(false);
      });
    });
  });

  describe('IndexedDB operations', () => {
    beforeEach(() => {
      // Mock IndexedDB with proper async behavior
      const mockDB = {
        transaction: vi.fn(),
        objectStoreNames: { contains: vi.fn(() => false) },
        createObjectStore: vi.fn()
      };

      const mockTransaction = {
        objectStore: vi.fn()
      };

      const mockStore = {
        put: vi.fn(() => ({
          onsuccess: null,
          onerror: null
        })),
        get: vi.fn(() => ({
          onsuccess: null,
          onerror: null,
          result: 'test-token'
        }))
      };

      mockDB.transaction.mockReturnValue(mockTransaction);
      mockTransaction.objectStore.mockReturnValue(mockStore);

      const mockOpenRequest = {
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any,
        result: mockDB
      };

      vi.mocked(window.indexedDB.open).mockReturnValue(mockOpenRequest as any);

      // Immediately trigger success
      vi.mocked(window.indexedDB.open).mockImplementation(() => {
        const req = mockOpenRequest;
        setTimeout(() => {
          if (req.onsuccess) req.onsuccess();
        }, 0);
        return req as any;
      });
    });

    it('should write token to IndexedDB', async () => {
      const token = 'pk.test123456789';
      
      // Mock the store operations to resolve immediately
      vi.mocked(window.indexedDB.open).mockImplementation(() => {
        const req = {
          onsuccess: null as any,
          onerror: null as any,
          onupgradeneeded: null as any,
          result: {
            transaction: () => ({
              objectStore: () => ({
                put: () => {
                  const putReq = { onsuccess: null as any, onerror: null as any };
                  setTimeout(() => putReq.onsuccess && putReq.onsuccess(), 0);
                  return putReq;
                }
              })
            })
          }
        };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req as any;
      });

      await expect(writeTokenToIDB(token)).resolves.toBeUndefined();
    });

    it('should read token from IndexedDB', async () => {
      vi.mocked(window.indexedDB.open).mockImplementation(() => {
        const req = {
          onsuccess: null as any,
          onerror: null as any,
          onupgradeneeded: null as any,
          result: {
            transaction: () => ({
              objectStore: () => ({
                get: () => {
                  const getReq = { 
                    onsuccess: null as any, 
                    onerror: null as any,
                    result: 'test-token'
                  };
                  setTimeout(() => getReq.onsuccess && getReq.onsuccess(), 0);
                  return getReq;
                }
              })
            })
          }
        };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req as any;
      });

      await expect(readTokenFromIDB()).resolves.toBe('test-token');
    });

    it('should handle IndexedDB errors gracefully', async () => {
      // Create a fresh mock without indexedDB
      const originalIndexedDB = window.indexedDB;
      delete (window as any).indexedDB;

      await expect(readTokenFromIDB()).resolves.toBeNull();

      // Restore
      (window as any).indexedDB = originalIndexedDB;
    });
  });

  describe('localStorage migration', () => {
    beforeEach(() => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      vi.mocked(localStorage.setItem).mockImplementation(() => {});
    });

    it('should migrate token from localStorage to IndexedDB', async () => {
      const token = 'pk.test123456789';
      vi.mocked(localStorage.getItem).mockReturnValue(token);

      // Mock successful migration
      vi.mocked(window.indexedDB.open).mockImplementation(() => {
        const req = {
          onsuccess: null as any,
          onerror: null as any,
          onupgradeneeded: null as any,
          result: {
            transaction: () => ({
              objectStore: () => ({
                get: () => {
                  const getReq = { 
                    onsuccess: null as any, 
                    onerror: null as any,
                    result: null // Not in IDB yet
                  };
                  setTimeout(() => getReq.onsuccess && getReq.onsuccess(), 0);
                  return getReq;
                },
                put: () => {
                  const putReq = { onsuccess: null as any, onerror: null as any };
                  setTimeout(() => putReq.onsuccess && putReq.onsuccess(), 0);
                  return putReq;
                }
              })
            })
          }
        };
        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
        return req as any;
      });

      const result = await migrateLocalStorageToIDB();
      expect(result).toBe(true);
    });

    it('should not migrate if no localStorage token exists', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
      
      const result = await migrateLocalStorageToIDB();
      expect(result).toBe(false);
    });
  });

  describe('Cookie mode', () => {
    it('should set and get cookie mode flag', () => {
      expect(isCookieMode()).toBe(false);
      
      setCookieMode(true);
      expect(isCookieMode()).toBe(true);
      
      setCookieMode(false);
      expect(isCookieMode()).toBe(false);
    });
  });

  describe('Session URL probing', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should probe session URL successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true
      } as Response);

      const result = await probeSessionURL('https://example.com/session');
      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('https://example.com/session', {
        method: 'HEAD',
        credentials: 'include'
      });
    });

    it('should handle session URL probe failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const result = await probeSessionURL('https://example.com/session');
      expect(result).toBe(false);
    });
  });
});