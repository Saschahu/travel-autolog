// File System Access API utilities for directory picker
// Using 'any' types to avoid conflicts with browser built-in types

const IDB_KEY = 'export-directory-handle';

export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

export const pickDirectory = async (): Promise<any | null> => {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser');
  }

  try {
    const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    if (handle.requestPermission) {
      const permission = await handle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        throw new Error('Permission to access directory was denied');
      }
    }

    return handle;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null; // User cancelled
    }
    throw error;
  }
};

export const persistHandle = async (handle: any): Promise<void> => {
  if (!('indexedDB' in window)) return;
  
  try {
    const db = await openIDB();
    const transaction = db.transaction(['handles'], 'readwrite');
    const store = transaction.objectStore('handles');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(handle, IDB_KEY);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to persist directory handle:', error);
  }
};

export const loadHandle = async (): Promise<any | null> => {
  if (!('indexedDB' in window)) return null;
  
  try {
    const db = await openIDB();
    const transaction = db.transaction(['handles'], 'readonly');
    const store = transaction.objectStore('handles');
    const handle = await new Promise<any | null>((resolve, reject) => {
      const request = store.get(IDB_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    return handle;
  } catch (error) {
    console.error('Failed to load directory handle:', error);
    return null;
  }
};

export const ensurePermission = async (handle: any): Promise<boolean> => {
  try {
    if (!handle.queryPermission) return true;
    
    const permission = await handle.queryPermission({ mode: 'readwrite' });
    
    if (permission === 'granted') {
      return true;
    }
    
    if (permission === 'prompt' && handle.requestPermission) {
      const granted = await handle.requestPermission({ mode: 'readwrite' });
      return granted === 'granted';
    }
    
    return false;
  } catch (error) {
    console.error('Failed to check/request permission:', error);
    return false;
  }
};

export const createSubdirectory = async (parentHandle: any, name: string): Promise<any> => {
  try {
    return await parentHandle.getDirectoryHandle(name, { create: true });
  } catch (error) {
    throw new Error(`Failed to create subdirectory "${name}": ${error}`);
  }
};

export const writeFile = async (directoryHandle: any, filename: string, blob: Blob): Promise<void> => {
  try {
    const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
  } catch (error) {
    throw new Error(`Failed to write file "${filename}": ${error}`);
  }
};

export const getDirectoryName = async (handle: any): Promise<string> => {
  try {
    return handle.name || 'Ausgewählter Ordner';
  } catch (error) {
    return 'Ausgewählter Ordner';
  }
};

// IndexedDB helper
const openIDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ServiTracker', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('handles')) {
        db.createObjectStore('handles');
      }
    };
  });
};