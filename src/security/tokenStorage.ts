// Token storage with Mapbox token validation and IndexedDB persistence

const MAPBOX_TOKEN_REGEX = /^pk\.[A-Za-z0-9._-]{10,}$/;
const IDB_DB_NAME = 'ServiceTracker';
const IDB_VERSION = 1;
const IDB_STORE_NAME = 'tokens';
const STORAGE_KEY = 'mapbox_token';

export function validateMapboxToken(token?: string): boolean {
  if (!token) return false;
  return MAPBOX_TOKEN_REGEX.test(token);
}

export function isValidMapboxToken(token?: string): boolean {
  return validateMapboxToken(token);
}

// IndexedDB operations
const openIDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(IDB_DB_NAME, IDB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
  });
};

export async function writeTokenToIDB(token: string): Promise<void> {
  const db = await openIDB();
  const transaction = db.transaction([IDB_STORE_NAME], 'readwrite');
  const store = transaction.objectStore(IDB_STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.put(token, STORAGE_KEY);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function readTokenFromIDB(): Promise<string | null> {
  try {
    const db = await openIDB();
    const transaction = db.transaction([IDB_STORE_NAME], 'readonly');
    const store = transaction.objectStore(IDB_STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(STORAGE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

// Idempotent migration from localStorage to IndexedDB
export async function migrateLocalStorageToIDB(): Promise<boolean> {
  try {
    const localToken = localStorage.getItem(STORAGE_KEY);
    if (!localToken) return false;
    
    // Check if already in IDB
    const idbToken = await readTokenFromIDB();
    if (idbToken === localToken) return false; // Already migrated
    
    // Migrate to IDB
    await writeTokenToIDB(localToken);
    return true;
  } catch {
    return false;
  }
}

// Cookie mode flag - bypass storage, probe session URL
let cookieModeEnabled = false;

export function setCookieMode(enabled: boolean): void {
  cookieModeEnabled = enabled;
}

export function isCookieMode(): boolean {
  return cookieModeEnabled;
}

export async function probeSessionURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      credentials: 'include' 
    });
    return response.ok;
  } catch {
    return false;
  }
}