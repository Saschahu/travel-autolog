import { Capacitor } from '@capacitor/core';

export const isNativeAndroid = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export const isWeb = (): boolean => Capacitor.getPlatform() === 'web';

export const isMobile = (): boolean => Capacitor.isNativePlatform();