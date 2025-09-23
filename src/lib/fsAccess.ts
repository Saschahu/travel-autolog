// File System Access API utilities for directory picker
// Using specific types to avoid conflicts with browser built-in types

import { saveExportHandle, loadExportHandle } from './fsStore';

const IDB_KEY = 'export-directory-handle';

type FileHandleLike = { 
  getFile?: () => Promise<unknown>;
  name?: string;
  queryPermission?: (options: { mode: string }) => Promise<PermissionState>;
  requestPermission?: (options: { mode: string }) => Promise<PermissionState>;
  getDirectoryHandle?: (name: string, options?: { create?: boolean }) => Promise<unknown>;
  getFileHandle?: (name: string, options?: { create?: boolean }) => Promise<unknown>;
  createWritable?: () => Promise<unknown>;
};

const isFn = (x: unknown, k: string): boolean => {
  return !!x && typeof (x as Record<string, unknown>)[k] === 'function';
};

export type DirHandle = FileHandleLike;

export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

export function isInCrossOriginFrame(): boolean {
  try {
    // If we're the top window, not in a frame
    if (window.top === window) return false;
    
    // Try to access parent origin - throws in cross-origin context
    if (window.top) {
      const origin = window.top.location.origin;
      // If no error thrown, check if origins differ
      return origin !== window.location.origin;
    }
    return false;
  } catch {
    // Access denied means cross-origin
    return true;
  }
}

export async function requestReadWrite(handle: unknown): Promise<boolean> {
  if (!handle || typeof handle !== 'object') return false;
  
  try {
    const h = handle as FileHandleLike;
    if (!isFn(h, 'requestPermission')) return true;
    const perm = await h.requestPermission!({ mode: 'readwrite' });
    return perm === 'granted';
  } catch {
    return false;
  }
}

export const pickDirectory = async (): Promise<FileHandleLike | null> => {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser');
  }

  try {
    const handle = await (window as { showDirectoryPicker?: (options: { mode: string }) => Promise<FileHandleLike> }).showDirectoryPicker?.({ mode: 'readwrite' });
    if (!handle) {
      throw new Error('Failed to get directory handle');
    }
    
    if (isFn(handle, 'requestPermission')) {
      const permission = await handle.requestPermission!({ mode: 'readwrite' });
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

export async function pickDirectoryDirect(): Promise<FileHandleLike | null> {
  // Check user activation (helps with debugging)
  if (navigator.userActivation && !navigator.userActivation.isActive) {
    throw new Error('No user activation');
  }

  const handle = await (window as { showDirectoryPicker?: (options: { mode: string }) => Promise<FileHandleLike> }).showDirectoryPicker?.({ mode: 'readwrite' });
  if (!handle) return null;
  
  if (isFn(handle, 'requestPermission')) {
    const permission = await handle.requestPermission!({ mode: 'readwrite' });
    if (permission !== 'granted') return null;
  }
  
  await saveExportHandle(handle, { displayName: handle.name || 'Unknown' });
  return handle;
}

export async function queryPermission(handle: unknown): Promise<PermissionState> {
  if (!handle || typeof handle !== 'object') return 'prompt';
  
  try {
    const h = handle as FileHandleLike;
    if (!isFn(h, 'queryPermission')) return 'prompt';
    const permission = await h.queryPermission!({ mode: 'readwrite' });
    return (permission ?? 'prompt') as PermissionState;
  } catch {
    return 'prompt';
  }
}

export async function requestPermission(handle: unknown): Promise<boolean> {
  if (!handle || typeof handle !== 'object') return false;
  
  try {
    const h = handle as FileHandleLike;
    if (!isFn(h, 'requestPermission')) return false;
    const permission = await h.requestPermission!({ mode: 'readwrite' });
    return permission === 'granted';
  } catch {
    return false;
  }
}

export function computeDisplayName(handle: unknown, meta?: { displayName?: string }): string {
  if (meta?.displayName) return meta.displayName;
  if (handle && typeof handle === 'object') {
    const h = handle as FileHandleLike;
    return h.name || 'Unbekannter Ordner';
  }
  return 'Unbekannter Ordner';
}

export function openDirectoryPickerBridge(): boolean {
  const bridgeUrl = `${window.location.origin}/bridge/directory-picker`;
  const newTab = window.open(bridgeUrl, '_blank', 'noopener,noreferrer');
  return !!newTab;
}

export async function waitForBridgeSelection(): Promise<FileHandleLike | null> {
  return new Promise<FileHandleLike | null>((resolve) => {
    let resolved = false;
    
    const cleanup = () => {
      if (bc) bc.close();
      window.removeEventListener('focus', onFocus);
      clearTimeout(timeoutId);
    };

    const resolveOnce = (result: FileHandleLike | null) => {
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

export const persistHandle = async (handle: unknown): Promise<void> => {
  if (!('indexedDB' in window)) return;
  if (!handle || typeof handle !== 'object') return;
  
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

export const loadHandle = async (): Promise<FileHandleLike | null> => {
  if (!('indexedDB' in window)) return null;
  
  try {
    const db = await openIDB();
    const transaction = db.transaction(['handles'], 'readonly');
    const store = transaction.objectStore('handles');
    const handle = await new Promise<FileHandleLike | null>((resolve, reject) => {
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

export const ensurePermission = async (handle: unknown): Promise<boolean> => {
  if (!handle || typeof handle !== 'object') return false;
  
  try {
    const h = handle as FileHandleLike;
    if (!isFn(h, 'queryPermission')) return true;
    
    const permission = await h.queryPermission!({ mode: 'readwrite' });
    
    if (permission === 'granted') {
      return true;
    }
    
    if (permission === 'prompt' && isFn(h, 'requestPermission')) {
      const granted = await h.requestPermission!({ mode: 'readwrite' });
      return granted === 'granted';
    }
    
    return false;
  } catch (error) {
    console.error('Failed to check/request permission:', error);
    return false;
  }
};

export const createSubdirectory = async (parentHandle: unknown, name: string): Promise<FileHandleLike> => {
  if (!parentHandle || typeof parentHandle !== 'object') {
    throw new Error('Invalid parent handle');
  }
  
  try {
    const h = parentHandle as FileHandleLike;
    if (!isFn(h, 'getDirectoryHandle')) {
      throw new Error('Handle does not support getDirectoryHandle');
    }
    
    const result = await h.getDirectoryHandle!(name, { create: true });
    return result as FileHandleLike;
  } catch (error) {
    throw new Error(`Failed to create subdirectory "${name}": ${error}`);
  }
};

export const writeFile = async (directoryHandle: unknown, filename: string, blob: Blob): Promise<void> => {
  if (!directoryHandle || typeof directoryHandle !== 'object') {
    throw new Error('Invalid directory handle');
  }
  
  try {
    const h = directoryHandle as FileHandleLike;
    if (!isFn(h, 'getFileHandle')) {
      throw new Error('Handle does not support getFileHandle');
    }
    
    const fileHandle = await h.getFileHandle!(filename, { create: true });
    if (!fileHandle || typeof fileHandle !== 'object' || !isFn(fileHandle, 'createWritable')) {
      throw new Error('Invalid file handle or no createWritable method');
    }
    
    const writable = await (fileHandle as FileHandleLike).createWritable!();
    if (!writable || typeof writable !== 'object') {
      throw new Error('Failed to create writable stream');
    }
    
    const writableStream = writable as { write: (data: Blob) => Promise<void>; close: () => Promise<void> };
    await writableStream.write(blob);
    await writableStream.close();
  } catch (error) {
    throw new Error(`Failed to write file "${filename}": ${error}`);
  }
};

export const getDirectoryName = async (handle: unknown): Promise<string> => {
  try {
    if (handle && typeof handle === 'object') {
      const h = handle as FileHandleLike;
      return h.name || 'Ausgewählter Ordner';
    }
    return 'Ausgewählter Ordner';
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