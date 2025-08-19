import { Capacitor } from '@capacitor/core';

export function getMapboxToken(): string | undefined {
  try {
    const ui = typeof window !== 'undefined'
      ? (localStorage.getItem('mapbox_token') || '').trim()
      : '';
    if (ui) return ui;

    // Native → mobiler Token; Web → Web-Token
    const env = (import.meta as any).env;
    const token = Capacitor.isNativePlatform()
      ? (env?.VITE_MAPBOX_TOKEN_MOBILE as string | undefined)
      : (env?.VITE_MAPBOX_TOKEN_WEB as string | undefined);
    return token?.trim();
  } catch {
    return undefined;
  }
}

export function looksLikePublicToken(t?: string) {
  return !!t && /^pk\.[A-Za-z0-9._\-]{10,}$/.test(t);
}