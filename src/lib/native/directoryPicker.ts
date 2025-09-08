import { registerPlugin } from '@capacitor/core';

export interface DirectoryPickerPlugin {
  pickDirectory(): Promise<{ uri: string }>;
  getPersisted(): Promise<{ uri?: string }>;
  writeFile(options: { uri: string; name: string; mime?: string; data: string }): Promise<void>;
}

export const DirectoryPicker = registerPlugin<DirectoryPickerPlugin>('DirectoryPicker', {
  web: () => import('./directoryPicker.web').then(m => new m.DirectoryPickerWeb()),
});