/**
 * Secure Token Storage with IndexedDB and Cookie Mode
 * 
 * Provides secure token storage using IndexedDB by default,
 * with optional cookie-based authentication mode.
 */

const DB_NAME = 'travel-autolog';
const STORE_NAME = 'secrets';
const TOKEN_KEY = 'mapbox_token';
const DB_VERSION = 1;

// Mapbox token validation regex
const MAPBOX_TOKEN_REGEX = /^pk\.[A-Za-z0-9._-]+$/;

/**
 * Validate Mapbox token format
 */
function validateMapboxToken(token: string): boolean {
  return typeof token === 'string' && MAPBOX_TOKEN_REGEX.test(token);
}

/**
 * Open IndexedDB connection
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Check if cookie mode is enabled
 */
function isCookieMode(): boolean {
  return import.meta.env.VITE_AUTH_COOKIE_MODE === 'true';
}

/**
 * Get session URL for cookie mode
 */
function getSessionUrl(): string {
  return import.meta.env.VITE_AUTH_SESSION_URL || '/auth/session';
}

/**
 * Get token from storage
 */
export async function getToken(): Promise<string | null> {
  if (isCookieMode()) {
    // In cookie mode, check session endpoint instead of client storage
    try {
      const response = await fetch(getSessionUrl(), {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.token || null;
      }
      return null;
    } catch (error) {
      console.warn('Failed to check session for token:', error);
      return null;
    }
  }

  // Standard mode: use IndexedDB
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(TOKEN_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const token = request.result;
        if (token && validateMapboxToken(token)) {
          resolve(token);
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.warn('Failed to get token from IndexedDB:', error);
    return null;
  }
}

/**
 * Set token in storage
 */
export async function setToken(token: string): Promise<void> {
  if (!validateMapboxToken(token)) {
    throw new Error('Invalid Mapbox token format. Token must start with "pk." and contain only valid characters.');
  }

  if (isCookieMode()) {
    throw new Error('Cannot store tokens client-side in cookie mode. Tokens must be managed server-side.');
  }

  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put(token, TOKEN_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Failed to store token in IndexedDB:', error);
    throw new Error('Failed to store token securely');
  }
}

/**
 * Clear token from storage
 */
export async function clearToken(): Promise<void> {
  if (isCookieMode()) {
    // In cookie mode, would need to call logout endpoint
    console.warn('Token clearing in cookie mode should be handled server-side');
    return;
  }

  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(TOKEN_KEY);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.warn('Failed to clear token from IndexedDB:', error);
    // Don't throw - clearing should be best-effort
  }
}

/**
 * Migrate tokens from localStorage to IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<{ migrated: boolean; reason?: string }> {
  if (isCookieMode()) {
    return { migrated: false, reason: 'Cookie mode - no client-side storage needed' };
  }

  try {
    const oldToken = localStorage.getItem('mapbox_token');
    if (!oldToken) {
      return { migrated: false, reason: 'No token found in localStorage' };
    }

    if (!validateMapboxToken(oldToken)) {
      localStorage.removeItem('mapbox_token');
      return { migrated: false, reason: 'Invalid token format in localStorage - removed' };
    }

    // Check if already migrated
    const existingToken = await getToken();
    if (existingToken) {
      localStorage.removeItem('mapbox_token');
      return { migrated: false, reason: 'Token already exists in secure storage' };
    }

    // Migrate the token
    await setToken(oldToken);
    localStorage.removeItem('mapbox_token');
    
    return { migrated: true };
  } catch (error) {
    console.error('Failed to migrate token from localStorage:', error);
    return { migrated: false, reason: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
