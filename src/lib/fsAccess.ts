// File System Access API utilities for directory picker
// Using proper types with guards to handle browser API limitations

import { saveExportHandle, loadExportHandle } from './fsStore';

const IDB_KEY = 'export-directory-handle';

// Type helpers for File System Access API
type FileHandleLike = {
  requestPermission?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<string>;
  getFile?: () => Promise<File>;
  createWritable?: () => Promise<unknown>;
  name?: string;
};

type DirHandleLike = {
  requestPermission?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<string>;  
  getFileHandle?: (name: string, options?: { create?: boolean }) => Promise<FileHandleLike>;
  values?: () => AsyncIterableIterator<unknown>;
  name?: string;
};

export type DirHandle = DirHandleLike;

// Type guards
const isFn = (obj: unknown, prop: string): boolean => {
  return obj != null && typeof obj === 'object' && prop in obj && typeof (obj as Record<string, unknown>)[prop] === 'function';
};

const isFileHandleLike = (obj: unknown): obj is FileHandleLike => {
  return obj != null && typeof obj === 'object';
};

const isDirHandleLike = (obj: unknown): obj is DirHandleLike => {
  return obj != null && typeof obj === 'object';
};

export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

export function isInCrossOriginFrame(): boolean {
  try {
    // If we're the top window, not in a frame
    if (window.top === window) return false;
    
    // Try to access parent origin - throws in cross-origin context
    if (window.top && window.top.location) {
      // Access parent origin to trigger error in cross-origin context
      void window.top.location.origin;
    }
    
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

export const pickDirectory = async (): Promise<DirHandleLike | null> => {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser');
  }

  try {
    const windowWithPicker = window as unknown;
    if (!windowWithPicker || typeof windowWithPicker !== 'object' || !('showDirectoryPicker' in windowWithPicker)) {
      throw new Error('showDirectoryPicker not available');
    }
    
    const picker = (windowWithPicker as { showDirectoryPicker: (options?: { mode?: string }) => Promise<unknown> }).showDirectoryPicker;
    const handle = await picker({ mode: 'readwrite' });
    
    if (!isDirHandleLike(handle)) {
      throw new Error('Invalid directory handle received');
    }
    
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
  const userActivation = navigator as unknown as { userActivation?: { isActive: boolean } };
  if (userActivation.userActivation && !userActivation.userActivation.isActive) {
    throw new Error('No user activation');
  }

  const windowWithPicker = window as unknown;
  if (!windowWithPicker || typeof windowWithPicker !== 'object' || !('showDirectoryPicker' in windowWithPicker)) {
    throw new Error('showDirectoryPicker not available');
  }
  
  const picker = (windowWithPicker as { showDirectoryPicker: (options?: { mode?: string }) => Promise<unknown> }).showDirectoryPicker;
  const handle = await picker({ mode: 'readwrite' });
  
  if (!isDirHandleLike(handle)) {
    return null;
  }
  
  const permission = await handle.requestPermission?.({ mode: 'readwrite' });
  if (permission !== 'granted') return null;
  
  await saveExportHandle(handle, { displayName: handle.name || 'Directory' });
  return handle;
}

export async function queryPermission(handle: unknown): Promise<PermissionState> {
  try {
    if (!isDirHandleLike(handle) || !handle.queryPermission) return 'prompt';
    const permission = await handle.queryPermission({ mode: 'readwrite' });
    return (permission ?? 'prompt') as PermissionState;
  } catch {
    return 'prompt';
  }
}

export async function requestPermission(handle: unknown): Promise<boolean> {
  try {
    if (!isDirHandleLike(handle) || !handle.requestPermission) return false;
    const permission = await handle.requestPermission({ mode: 'readwrite' });
    return permission === 'granted';
  } catch {
    return false;
  }
}

export function computeDisplayName(handle: unknown, meta?: { displayName?: string }): string {
  const dirHandle = isDirHandleLike(handle) ? handle : null;
  return meta?.displayName || dirHandle?.name || 'Unbekannter Ordner';
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

export const persistHandle = async (handle: unknown): Promise<void> => {
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

export const loadHandle = async (): Promise<unknown | null> => {
  if (!('indexedDB' in window)) return null;
  
  try {
    const db = await openIDB();
    const transaction = db.transaction(['handles'], 'readonly');
    const store = transaction.objectStore('handles');
    const handle = await new Promise<unknown | null>((resolve, reject) => {
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
  try {
    if (!isDirHandleLike(handle) || !handle.queryPermission) return true;
    
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

export const createSubdirectory = async (parentHandle: unknown, name: string): Promise<unknown> => {
  try {
    if (!isDirHandleLike(parentHandle) || !parentHandle.getDirectoryHandle) {
      throw new Error('Invalid parent directory handle');
    }
    return await parentHandle.getDirectoryHandle(name, { create: true });
  } catch (error) {
    throw new Error(`Failed to create subdirectory "${name}": ${error}`);
  }
};

export const writeFile = async (directoryHandle: unknown, filename: string, blob: Blob): Promise<void> => {
  try {
    if (!isDirHandleLike(directoryHandle) || !directoryHandle.getFileHandle) {
      throw new Error('Invalid directory handle');
    }
    const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
    if (!isFileHandleLike(fileHandle) || !fileHandle.createWritable) {
      throw new Error('Invalid file handle');
    }
    const writable = await fileHandle.createWritable();
    if (writable && typeof writable === 'object' && 'write' in writable && 'close' in writable) {
      await (writable as { write: (data: Blob) => Promise<void>; close: () => Promise<void> }).write(blob);
      await (writable as { write: (data: Blob) => Promise<void>; close: () => Promise<void> }).close();
    }
  } catch (error) {
    throw new Error(`Failed to write file "${filename}": ${error}`);
  }
};

export const getDirectoryName = async (handle: unknown): Promise<string> => {
  try {
    const dirHandle = isDirHandleLike(handle) ? handle : null;
    return dirHandle?.name || 'Ausgewählter Ordner';
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