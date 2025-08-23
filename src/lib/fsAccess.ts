// File System Access API utilities for directory picker
// Using 'any' types to avoid conflicts with browser built-in types

import { saveExportHandle, loadExportHandle } from './fsStore';

const IDB_KEY = 'export-directory-handle';

export type DirHandle = any;

export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

export function isInCrossOriginFrame(): boolean {
  try {
    // If we're the top window, not in a frame
    if (window.top === window) return false;
    
    // Try to access parent origin - throws in cross-origin context
    // eslint-disable-next-line no-unused-expressions
    (window.top as Window).location.origin;
    
    // If no error thrown, check if origins differ
    return window.top!.location.origin !== window.location.origin;
  } catch {
    // Access denied means cross-origin
    return true;
  }
}

export async function requestReadWrite(handle: DirHandle): Promise<boolean> {
  try {
    if (!handle.requestPermission) return true;
    const perm = await handle.requestPermission({ mode: 'readwrite' });
    return perm === 'granted';
  } catch {
    return false;
  }
}

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

export async function pickDirectoryDirect(): Promise<DirHandle | null> {
  // Check user activation (helps with debugging)
  if (navigator.userActivation && !navigator.userActivation.isActive) {
    throw new Error('No user activation');
  }

  const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
  const permission = await handle.requestPermission?.({ mode: 'readwrite' });
  if (permission !== 'granted') return null;
  
  await saveExportHandle(handle, { displayName: handle.name });
  return handle;
}

export async function queryPermission(handle: any): Promise<PermissionState> {
  try {
    const permission = await handle.queryPermission?.({ mode: 'readwrite' });
    return (permission ?? 'prompt') as PermissionState;
  } catch {
    return 'prompt';
  }
}

export async function requestPermission(handle: any): Promise<boolean> {
  try {
    const permission = await handle.requestPermission?.({ mode: 'readwrite' });
    return permission === 'granted';
  } catch {
    return false;
  }
}

export function computeDisplayName(handle: any, meta?: { displayName?: string }): string {
  return meta?.displayName || handle?.name || 'Unbekannter Ordner';
}

export function openDirectoryPickerBridge(): boolean {
  const bridgeUrl = `${window.location.origin}/bridge/directory-picker`;
  const newTab = window.open(bridgeUrl, '_blank', 'noopener,noreferrer');
  return !!newTab;
}

export async function waitForBridgeSelection(): Promise<DirHandle | null> {
  return new Promise<DirHandle | null>((resolve) => {
    let resolved = false;
    
    const cleanup = () => {
      if (bc) bc.close();
      window.removeEventListener('focus', onFocus);
      clearTimeout(timeoutId);
    };

    const resolveOnce = (result: DirHandle | null) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve(result);
    };

    // BroadcastChannel listener
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('fs-bridge');
      bc.addEventListener('message', async (ev: MessageEvent) => {
        if (ev.data?.type === 'fs:selected' && ev.data.key === 'exportDir') {
          const handle = await loadExportHandle();
          resolveOnce(handle);
        }
      });
    } catch (bcError) {
      console.warn('BroadcastChannel not available, using localStorage fallback');
    }

    // localStorage fallback (for when BroadcastChannel is blocked)
    const onFocus = async () => {
      const ts = localStorage.getItem('fs.exportDir.selectedAt');
      if (ts && Number(ts) > Date.now() - 30000) { // 30 second window
        localStorage.removeItem('fs.exportDir.selectedAt');
        const handle = await loadExportHandle();
        resolveOnce(handle);
      }
    };
    window.addEventListener('focus', onFocus);

    // Timeout after 60 seconds
    const timeoutId = setTimeout(() => {
      resolveOnce(null);
    }, 60000);
  });
}

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
    const request = indexedDB.open('ServiceTracker', 1);
    
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