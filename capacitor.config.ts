import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.travelautolog',
  appName: 'Travel AutoLog',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    DirectoryPicker: {
      class: 'DirectoryPickerPlugin'
    },
    EmailSender: {
      class: 'EmailSenderPlugin'
    }
  },
  android: {
    allowMixedContent: true
  }
};

export default config;