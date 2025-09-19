/**
 * Secure token storage using IndexedDB
 * Provides validated storage for Mapbox tokens with migration from localStorage
 */

const DB_NAME = 'travel-autolog';
const DB_VERSION = 1;
const STORE_NAME = 'secrets';
const TOKEN_KEY = 'mapbox_token';

// Validation regex for Mapbox public tokens
const MAPBOX_TOKEN_REGEX = /^pk\.[a-zA-Z0-9._-]+$/;

/**
 * Opens IndexedDB connection
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      reject(new Error(`Failed to open IndexedDB: ${request.error?.message || 'Unknown error'}`));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Validates Mapbox token format
 * @param token - Token to validate
 * @returns true if token is valid format
 */
function validateToken(token: string): boolean {
  return MAPBOX_TOKEN_REGEX.test(token);
}

/**
 * Gets the stored Mapbox token from IndexedDB
 * @returns Promise resolving to token string or null if not found
 */
export async function getToken(): Promise<string | null> {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(TOKEN_KEY);
      
      request.onerror = () => {
        reject(new Error(`Failed to get token: ${request.error?.message || 'Unknown error'}`));
      };
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error getting token from IndexedDB:', error);
    return null;
  }
}

/**
 * Sets the Mapbox token in IndexedDB with validation
 * @param token - Token to store (must be valid Mapbox public token format)
 * @throws Error if token format is invalid
 */
export async function setToken(token: string): Promise<void> {
  // Validate token format - fail closed
  if (!validateToken(token)) {
    throw new Error('Invalid token format. Token must match Mapbox public token format: pk.[a-zA-Z0-9._-]+');
  }
  
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(token, TOKEN_KEY);
      
      request.onerror = () => {
        reject(new Error(`Failed to set token: ${request.error?.message || 'Unknown error'}`));
      };
      
      request.onsuccess = () => {
        resolve();
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    throw new Error(`Failed to store token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clears the stored token from IndexedDB
 */
export async function clearToken(): Promise<void> {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(TOKEN_KEY);
      
      request.onerror = () => {
        reject(new Error(`Failed to clear token: ${request.error?.message || 'Unknown error'}`));
      };
      
      request.onsuccess = () => {
        resolve();
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    throw new Error(`Failed to clear token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Migrates token from localStorage to IndexedDB
 * This function is idempotent and safe to call multiple times
 * @returns Promise resolving to migration result
 */
export async function migrateFromLocalStorage(): Promise<{ migrated: boolean; reason?: string }> {
  try {
    // Check if localStorage is available
    if (typeof localStorage === 'undefined') {
      return { migrated: false, reason: 'localStorage-unavailable' };
    }
    
    // Get token from localStorage
    const localToken = localStorage.getItem('mapbox_token');
    
    if (!localToken) {
      return { migrated: false, reason: 'no-token-in-localstorage' };
    }
    
    // Validate the token format
    if (!validateToken(localToken)) {
      // Invalid token - remove it from localStorage
      localStorage.removeItem('mapbox_token');
      return { migrated: false, reason: 'invalid-format' };
    }
    
    // Check if token is already in IndexedDB
    const existingToken = await getToken();
    if (existingToken === localToken) {
      // Token already migrated, just clean up localStorage
      localStorage.removeItem('mapbox_token');
      return { migrated: true };
    }
    
    // Store valid token in IndexedDB
    await setToken(localToken);
    
    // Remove from localStorage after successful storage
    localStorage.removeItem('mapbox_token');
    
    return { migrated: true };
    
  } catch (error) {
    console.error('Error during token migration:', error);
    return { migrated: false, reason: 'migration-error' };
  }
}