import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.travelautolog',
  appName: 'ServiceTracker',
  webDir: 'dist',
  server: {
    url: 'https://7203a855-7cd4-4e82-992d-2cef8e48eef7.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;