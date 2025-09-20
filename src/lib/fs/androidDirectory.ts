// Android SAF Directory implementation
import { toBase64 } from '@/lib/files';
import { DirectoryPicker } from '@/plugins/directoryPicker';

export interface AndroidDirectoryRef {
  kind: 'android-uri';
  uri: string;
  displayName?: string;
}

export async function pickDirectoryAndroid(): Promise<AndroidDirectoryRef> {
  try {
    const result = await DirectoryPicker.pickDirectory();
    
    return {
      kind: 'android-uri',
      uri: result.uri,
      displayName: result.displayName || 'Android Directory'
    };
  } catch (error) {
    if (String(error).includes('USER_CANCELLED')) {
      throw new Error('USER_CANCELLED');
    }
    throw new Error(`Android directory picker failed: ${error}`);
  }
}

export async function checkPermissionAndroid(uri: string): Promise<boolean> {
  try {
    const result = await DirectoryPicker.checkUriPermission({ uri });
    return result.has;
  } catch (error) {
    console.error('Failed to check Android URI permission:', error);
    return false;
  }
}

export async function writeTestFileAndroid(uri: string): Promise<string> {
  const fileName = `ServiceTracker_Test_${Date.now()}.txt`;
  const content = `Test write successful at ${new Date().toISOString()}`;
  const base64Data = await toBase64(new Blob([content], { type: 'text/plain' }));

  try {
    const result = await DirectoryPicker.writeFile({
      dirUri: uri,
      fileName,
      mimeType: 'text/plain',
      base64Data
    });

    if (!result.success) {
      throw new Error('Write operation failed');
    }

    return fileName;
  } catch (error) {
    throw new Error(`Failed to write test file: ${error}`);
  }
}

export async function writeFileAndroid(uri: string, fileName: string, blob: Blob, mimeType?: string): Promise<string> {
  const base64Data = await toBase64(blob);
  const finalMimeType = mimeType || blob.type || 'application/octet-stream';

  try {
    const result = await DirectoryPicker.writeFile({
      dirUri: uri,
      fileName,
      mimeType: finalMimeType,
      base64Data
    });

    if (!result.success) {
      throw new Error('Write operation failed');
    }

    return result.uri;
  } catch (error) {
    throw new Error(`Failed to write file "${fileName}": ${error}`);
  }
}