import { registerPlugin } from '@capacitor/core';

export interface DirectoryPickerPlugin {
  pickDirectory(): Promise<{ uri: string; displayName?: string }>;
  writeFile(options: { 
    dirUri: string; 
    fileName: string; 
    mimeType: string; 
    base64Data: string 
  }): Promise<{ uri: string; success: boolean }>;
  checkUriPermission(options: { uri: string }): Promise<{ has: boolean }>;
  getDisplayName?(options: { uri: string }): Promise<{ displayName: string | null }>;
}

export const DirectoryPicker = registerPlugin<DirectoryPickerPlugin>('DirectoryPicker');