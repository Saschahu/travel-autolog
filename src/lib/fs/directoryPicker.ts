// Unified directory picker interface for both web and Android
import type { AndroidDirectoryRef } from './androidDirectory';
import {
  pickDirectoryAndroid,
  checkPermissionAndroid,
  writeTestFileAndroid
} from './androidDirectory';
import type { WebDirectoryHandle } from './webDirectory';
import {
  pickDirectoryWeb,
  loadPersistedWebHandle,
  writeTestFileWeb,
  clearWebSelection,
  isFileSystemAccessSupported,
  isInCrossOriginFrame,
  openPickerInNewTab,
  waitForBridgeSelection,
  ensurePermission
} from './webDirectory';
import { isNativeAndroid } from '@/lib/platform';

// Re-export functions for external use
export { isFileSystemAccessSupported, isInCrossOriginFrame } from './webDirectory';

export type ExportFolderRef = WebDirectoryHandle | AndroidDirectoryRef;

export interface DirectoryPickerResult {
  success: boolean;
  ref?: ExportFolderRef;
  error?: string;
}

export interface TestWriteResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

export async function pickDirectory(): Promise<DirectoryPickerResult> {
  try {
    if (isNativeAndroid()) {
      const ref = await pickDirectoryAndroid();
      return { success: true, ref };
    } else {
      // Web platform
      if (!isFileSystemAccessSupported()) {
        return { 
          success: false, 
          error: 'Browser does not support directory picker' 
        };
      }

      if (isInCrossOriginFrame()) {
        // Open in new tab for cross-origin contexts
        const opened = openPickerInNewTab();
        if (!opened) {
          return { 
            success: false, 
            error: 'Pop-up blocked. Please allow pop-ups and try again.' 
          };
        }

        // Wait for selection from bridge
        const ref = await waitForBridgeSelection();
        return ref ? { success: true, ref } : { success: false, error: 'Selection cancelled or timed out' };
      } else {
        // Direct picker
        const ref = await pickDirectoryWeb();
        return ref ? { success: true, ref } : { success: false, error: 'Selection cancelled' };
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('USER_CANCELLED')) {
      return { success: false, error: 'Selection cancelled by user' };
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function loadPersistedDirectory(): Promise<ExportFolderRef | null> {
  try {
    if (isNativeAndroid()) {
      // Load from localStorage for Android
      const savedUri = localStorage.getItem('android-export-dir-uri');
      const savedName = localStorage.getItem('android-export-dir-name');
      
      if (savedUri) {
        // Check if permission still exists
        const hasPermission = await checkPermissionAndroid(savedUri);
        if (hasPermission) {
          return {
            kind: 'android-uri',
            uri: savedUri,
            displayName: savedName || 'Android Directory'
          };
        } else {
          // Clear invalid URI
          localStorage.removeItem('android-export-dir-uri');
          localStorage.removeItem('android-export-dir-name');
        }
      }
      
      return null;
    } else {
      // Load from IndexedDB for web
      return await loadPersistedWebHandle();
    }
  } catch (error) {
    console.error('Failed to load persisted directory:', error);
    return null;
  }
}

export async function persistDirectory(ref: ExportFolderRef): Promise<void> {
  try {
    if (ref.kind === 'android-uri') {
      localStorage.setItem('android-export-dir-uri', ref.uri);
      if (ref.displayName) {
        localStorage.setItem('android-export-dir-name', ref.displayName);
      }
    }
    // Web handles are automatically persisted in pickDirectoryWeb
  } catch (error) {
    console.error('Failed to persist directory:', error);
  }
}

export async function clearDirectorySelection(): Promise<void> {
  try {
    if (isNativeAndroid()) {
      localStorage.removeItem('android-export-dir-uri');
      localStorage.removeItem('android-export-dir-name');
    } else {
      await clearWebSelection();
    }
  } catch (error) {
    console.error('Failed to clear directory selection:', error);
  }
}

export async function testWrite(ref: ExportFolderRef): Promise<TestWriteResult> {
  try {
    if (ref.kind === 'android-uri') {
      const fileName = await writeTestFileAndroid(ref.uri);
      return { success: true, fileName };
    } else {
      const fileName = await writeTestFileWeb(ref.handle);
      return { success: true, fileName };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function checkDirectoryPermission(ref: ExportFolderRef): Promise<boolean> {
  try {
    if (ref.kind === 'android-uri') {
      return await checkPermissionAndroid(ref.uri);
    } else {
      return await ensurePermission(ref.handle);
    }
  } catch (error) {
    console.error('Failed to check directory permission:', error);
    return false;
  }
}

export function getDisplayName(ref: ExportFolderRef): string {
  if (ref.kind === 'android-uri') {
    return ref.displayName || 'Android Directory';
  } else {
    return ref.displayName || ref.handle.name || 'Selected Directory';
  }
}

export function getPermissionStatus(ref: ExportFolderRef): string {
  if (ref.kind === 'android-uri') {
    return 'Android SAF granted';
  } else {
    return 'File System Access granted';
  }
}

// Export target interface for unified file writing
export interface ExportTarget {
  writeFile(fileName: string, blob: Blob, mimeType?: string): Promise<string>;
}

export function createExportTarget(ref: ExportFolderRef): ExportTarget {
  if (ref.kind === 'android-uri') {
    return {
      async writeFile(fileName: string, blob: Blob, mimeType?: string): Promise<string> {
        const { writeFileAndroid } = await import('./androidDirectory');
        return await writeFileAndroid(ref.uri, fileName, blob, mimeType);
      }
    };
  } else {
    return {
      async writeFile(fileName: string, blob: Blob): Promise<string> {
        try {
          const fileHandle = await ref.handle.getFileHandle(fileName, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return fileName;
        } catch (error) {
          throw new Error(`Failed to write file "${fileName}": ${error}`);
        }
      }
    };
  }
}