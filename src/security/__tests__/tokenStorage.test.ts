import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { get, set, del } from 'idb-keyval';
import {
  validateMapboxToken,
  readTokenFromIDB,
  writeTokenToIDB,
  removeTokenFromIDB,
  migrateTokenStorage,
  isMigrationComplete,
  markMigrationComplete,
  getTokenWithCookieBypass
} from '../tokenStorage';

// Mock idb-keyval
vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('Token Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('validateMapboxToken', () => {
    it('should validate valid Mapbox public token', () => {
      const validToken = 'pk.eyJ1IjoidGVzdCIsImEiOiJjbGV0ZXN0In0.test123';
      const result = validateMapboxToken(validToken);
      
      expect(result.isValid).toBe(true);
      expect(result.token).toBe(validToken);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid token format', () => {
      const invalidToken = 'sk.invalid_secret_token';
      const result = validateMapboxToken(invalidToken);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token format invalid');
    });

    it('should reject empty token', () => {
      const result = validateMapboxToken('');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token is empty');
    });

    it('should reject undefined token', () => {
      const result = validateMapboxToken(undefined);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token is empty');
    });

    it('should reject token with only whitespace', () => {
      const result = validateMapboxToken('   \n\t  ');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token is empty after trimming');
    });

    it('should trim valid token', () => {
      const tokenWithSpaces = '  pk.eyJ1IjoidGVzdCIsImEiOiJjbGV0ZXN0In0.test123  ';
      const result = validateMapboxToken(tokenWithSpaces);
      
      expect(result.isValid).toBe(true);
      expect(result.token).toBe('pk.eyJ1IjoidGVzdCIsImEiOiJjbGV0ZXN0In0.test123');
    });
  });

  describe('IndexedDB operations', () => {
    it('should read token from IndexedDB', async () => {
      const mockToken = 'pk.test123';
      vi.mocked(get).mockResolvedValueOnce(mockToken);

      const result = await readTokenFromIDB();

      expect(get).toHaveBeenCalledWith('mapbox_token');
      expect(result).toBe(mockToken);
    });

    it('should handle IndexedDB read errors', async () => {
      vi.mocked(get).mockRejectedValueOnce(new Error('IDB Error'));

      const result = await readTokenFromIDB();

      expect(result).toBeUndefined();
    });

    it('should write token to IndexedDB', async () => {
      const token = 'pk.test123';
      vi.mocked(set).mockResolvedValueOnce(undefined);

      await writeTokenToIDB(token);

      expect(set).toHaveBeenCalledWith('mapbox_token', token);
    });

    it('should throw on IndexedDB write errors', async () => {
      const token = 'pk.test123';
      const error = new Error('IDB Write Error');
      vi.mocked(set).mockRejectedValueOnce(error);

      await expect(writeTokenToIDB(token)).rejects.toThrow('IDB Write Error');
    });

    it('should remove token from IndexedDB', async () => {
      vi.mocked(del).mockResolvedValueOnce(undefined);

      await removeTokenFromIDB();

      expect(del).toHaveBeenCalledWith('mapbox_token');
    });

    it('should handle IndexedDB remove errors gracefully', async () => {
      vi.mocked(del).mockRejectedValueOnce(new Error('IDB Delete Error'));

      // Should not throw
      await expect(removeTokenFromIDB()).resolves.toBeUndefined();
    });
  });

  describe('Migration', () => {
    it('should check migration status', async () => {
      vi.mocked(get).mockResolvedValueOnce(true);

      const result = await isMigrationComplete();

      expect(get).toHaveBeenCalledWith('token_migration_complete');
      expect(result).toBe(true);
    });

    it('should return false if migration check fails', async () => {
      vi.mocked(get).mockRejectedValueOnce(new Error('IDB Error'));

      const result = await isMigrationComplete();

      expect(result).toBe(false);
    });

    it('should mark migration as complete', async () => {
      vi.mocked(set).mockResolvedValueOnce(undefined);

      await markMigrationComplete();

      expect(set).toHaveBeenCalledWith('token_migration_complete', true);
    });

    it('should perform idempotent localStorage to IndexedDB migration', async () => {
      const lsToken = 'pk.test123';
      
      // Setup: migration not complete, token in localStorage
      vi.mocked(get)
        .mockResolvedValueOnce(false) // isMigrationComplete
        .mockResolvedValue(undefined); // Other calls
      mockLocalStorage.getItem.mockReturnValue(lsToken);
      vi.mocked(set).mockResolvedValue(undefined);

      await migrateTokenStorage();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('mapbox_token');
      expect(set).toHaveBeenCalledWith('mapbox_token', lsToken);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('mapbox_token');
      expect(set).toHaveBeenCalledWith('token_migration_complete', true);
    });

    it('should skip migration if already complete', async () => {
      vi.mocked(get).mockResolvedValueOnce(true); // isMigrationComplete

      await migrateTokenStorage();

      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
      expect(set).not.toHaveBeenCalled();
    });

    it('should skip migration if no localStorage token', async () => {
      vi.mocked(get).mockResolvedValueOnce(false); // isMigrationComplete
      mockLocalStorage.getItem.mockReturnValue(null);
      vi.mocked(set).mockResolvedValue(undefined);

      await migrateTokenStorage();

      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      expect(set).toHaveBeenCalledWith('token_migration_complete', true);
    });

    it('should skip migration if localStorage token is invalid', async () => {
      vi.mocked(get).mockResolvedValueOnce(false); // isMigrationComplete
      mockLocalStorage.getItem.mockReturnValue('invalid-token');
      vi.mocked(set).mockResolvedValue(undefined);

      await migrateTokenStorage();

      expect(set).not.toHaveBeenCalledWith('mapbox_token', expect.anything());
      expect(set).toHaveBeenCalledWith('token_migration_complete', true);
    });
  });

  describe('Cookie mode bypass', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      // Mock window.location
      delete (window as any).location;
      window.location = new URL('https://example.com') as any;
    });

    afterAll(() => {
      window.location = originalLocation;
    });

    it('should bypass storage and check session URL in cookie mode', async () => {
      const sessionToken = 'pk.session123';
      window.location.href = `https://example.com?session_token=${sessionToken}`;

      const result = await getTokenWithCookieBypass(true);

      expect(result).toBe(sessionToken);
      expect(get).not.toHaveBeenCalled(); // Should not check IndexedDB
    });

    it('should return undefined in cookie mode with invalid session token', async () => {
      window.location.href = 'https://example.com?session_token=invalid-token';

      const result = await getTokenWithCookieBypass(true);

      expect(result).toBeUndefined();
    });

    it('should return undefined in cookie mode with no session token', async () => {
      window.location.href = 'https://example.com';

      const result = await getTokenWithCookieBypass(true);

      expect(result).toBeUndefined();
    });

    it('should use normal flow when not in cookie mode', async () => {
      const idbToken = 'pk.idb123';
      vi.mocked(get).mockResolvedValueOnce(true); // migration complete
      vi.mocked(get).mockResolvedValueOnce(idbToken); // token from IDB

      const result = await getTokenWithCookieBypass(false);

      expect(result).toBe(idbToken);
      expect(get).toHaveBeenCalledWith('mapbox_token');
    });

    it('should handle URL parsing errors gracefully in cookie mode', async () => {
      // Mock URL constructor to throw
      const originalURL = window.URL;
      window.URL = vi.fn().mockImplementation(() => {
        throw new Error('Invalid URL');
      });

      const result = await getTokenWithCookieBypass(true);

      expect(result).toBeUndefined();

      // Restore URL
      window.URL = originalURL;
    });
  });
});