// IndexedDB storage for FileSystem handles
import { set, get, del } from 'idb-keyval';

const KEY_EXPORT_HANDLE = 'exportDirHandle';
const KEY_EXPORT_META = 'exportDirMeta';

export async function saveExportHandle(handle: any, meta?: { displayName?: string; createdByApp?: boolean }): Promise<void> {
  await set(KEY_EXPORT_HANDLE, handle);
  if (meta) {
    await set(KEY_EXPORT_META, meta);
  }
}

export async function loadExportHandle(): Promise<any | null> {
  try {
    return await get(KEY_EXPORT_HANDLE);
  } catch (error) {
    console.error('Failed to load export handle:', error);
    return null;
  }
}

export async function loadExportMeta(): Promise<{ displayName?: string; createdByApp?: boolean } | null> {
  try {
    return await get(KEY_EXPORT_META);
  } catch (error) {
    console.error('Failed to load export meta:', error);
    return null;
  }
}

export async function clearExportHandle(): Promise<void> {
  try {
    await del(KEY_EXPORT_HANDLE);
    await del(KEY_EXPORT_META);
  } catch (error) {
    console.error('Failed to clear export handle:', error);
  }
}