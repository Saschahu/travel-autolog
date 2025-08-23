// IndexedDB storage for FileSystem handles
import { set, get } from 'idb-keyval';

const KEY_EXPORT_HANDLE = 'exportDirHandle';

export async function saveExportHandle(handle: any): Promise<void> {
  await set(KEY_EXPORT_HANDLE, handle);
}

export async function loadExportHandle(): Promise<any | null> {
  try {
    return await get(KEY_EXPORT_HANDLE);
  } catch (error) {
    console.error('Failed to load export handle:', error);
    return null;
  }
}