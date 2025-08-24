import { registerPlugin } from '@capacitor/core';

export interface DirectoryPickerPlugin {
  pickDirectory(): Promise<{ uri: string }>;
  createFile(options: { directoryUri: string; fileName: string; mime?: string; base64: string }):
    Promise<{ uri: string }>;
}

export const DirectoryPicker = registerPlugin<DirectoryPickerPlugin>('DirectoryPicker');