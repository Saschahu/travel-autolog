import type { DirectoryPickerPlugin } from './directoryPicker';

export class DirectoryPickerWeb implements DirectoryPickerPlugin {
  async pickDirectory(): Promise<{ uri: string }> {
    if ('showDirectoryPicker' in window) {
      // Fake-URI nur für Web-Persistenz; echte Handles verwaltet ihr separat, falls benötigt.
      return { uri: 'web://directory' };
    }
    throw new Error('Directory picker not supported in this browser.');
  }
  async getPersisted(): Promise<{ uri?: string }> {
    return {};
  }
  async writeFile(): Promise<void> {
    throw new Error('writeFile is only implemented natively (Android).');
  }
}