// Web File System Access API implementation
import { saveExportHandle, loadExportHandle, loadExportMeta, clearExportHandle } from '@/lib/fsStore';

export interface WebDirectoryHandle {
  kind: 'web-handle';
  handle: FileSystemDirectoryHandle;
  displayName?: string;
}

export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};

export function isInCrossOriginFrame(): boolean {
  try {
    if (window.top === window) return false;
     
    (window.top as Window).location.origin;
    return window.top!.location.origin !== window.location.origin;
  } catch {
    return true;
  }
}

export async function pickDirectoryWeb(): Promise<WebDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API is not supported in this browser');
  }

  // Check user activation
  if (navigator.userActivation && !navigator.userActivation.isActive) {
    throw new Error('No user activation - action must be triggered by user gesture');
  }

  try {
    const handle = await (window as any).showDirectoryPicker({ 
      mode: 'readwrite',
      startIn: 'documents'
    });

    // Request permission
    const permission = await handle.requestPermission?.({ mode: 'readwrite' });
    if (permission !== 'granted') {
      throw new Error('Permission to access directory was denied');
    }

    const webHandle: WebDirectoryHandle = {
      kind: 'web-handle',
      handle,
      displayName: handle.name
    };

    // Persist handle
    await saveExportHandle(handle, { displayName: handle.name });

    return webHandle;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return null; // User cancelled
    }
    throw error;
  }
}

export async function loadPersistedWebHandle(): Promise<WebDirectoryHandle | null> {
  try {
    const [handle, meta] = await Promise.all([loadExportHandle(), loadExportMeta()]);
    
    if (!handle) return null;

    // Check if handle is still valid and has permission
    const permission = await handle.queryPermission?.({ mode: 'readwrite' });
    if (permission !== 'granted') {
      return null;
    }

    return {
      kind: 'web-handle',
      handle,
      displayName: meta?.displayName || handle.name
    };
  } catch (error) {
    console.error('Failed to load persisted web handle:', error);
    return null;
  }
}

export async function ensurePermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    const permission = await handle.queryPermission?.({ mode: 'readwrite' });
    
    if (permission === 'granted') {
      return true;
    }
    
    if (permission === 'prompt') {
      const granted = await handle.requestPermission?.({ mode: 'readwrite' });
      return granted === 'granted';
    }
    
    return false;
  } catch (error) {
    console.error('Failed to check/request permission:', error);
    return false;
  }
}

export async function writeTestFileWeb(handle: FileSystemDirectoryHandle): Promise<string> {
  const fileName = `ServiceTracker_Test_${Date.now()}.txt`;
  const content = `Test write successful at ${new Date().toISOString()}`;
  const blob = new Blob([content], { type: 'text/plain' });

  try {
    const fileHandle = await handle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    
    return fileName;
  } catch (error) {
    throw new Error(`Failed to write test file: ${error}`);
  }
}

export function openPickerInNewTab(): boolean {
  const bridgeUrl = `${window.location.origin}/bridge/directory-picker`;
  const newTab = window.open(bridgeUrl, '_blank', 'noopener,noreferrer');
  return !!newTab;
}

export async function waitForBridgeSelection(): Promise<WebDirectoryHandle | null> {
  return new Promise<WebDirectoryHandle | null>((resolve) => {
    let resolved = false;
    
    const cleanup = () => {
      if (bc) bc.close();
      window.removeEventListener('focus', onFocus);
      clearTimeout(timeoutId);
    };

    const resolveOnce = (result: WebDirectoryHandle | null) => {
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
          const webHandle = await loadPersistedWebHandle();
          resolveOnce(webHandle);
        }
      });
    } catch (bcError) {
      console.warn('BroadcastChannel not available, using localStorage fallback');
    }

    // localStorage fallback
    const onFocus = async () => {
      const ts = localStorage.getItem('fs.exportDir.selectedAt');
      if (ts && Number(ts) > Date.now() - 30000) {
        localStorage.removeItem('fs.exportDir.selectedAt');
        const webHandle = await loadPersistedWebHandle();
        resolveOnce(webHandle);
      }
    };
    window.addEventListener('focus', onFocus);

    // Timeout after 60 seconds
    const timeoutId = setTimeout(() => {
      resolveOnce(null);
    }, 60000);
  });
}

export async function clearWebSelection(): Promise<void> {
  await clearExportHandle();
}