import { Capacitor } from '@capacitor/core';

export function normalizeToken(input: unknown): string {
  if (typeof input === 'string') return input.trim();
  return '';
}

export function getMapboxToken(): string | undefined {
  try {
    const ui = typeof window !== 'undefined'
      ? normalizeToken(localStorage.getItem('mapbox_token') || '')
      : '';
    if (ui) return ui;

    // Native → mobiler Token; Web → Web-Token
    const env = import.meta.env as unknown;
    if (!env || typeof env !== 'object') return undefined;
    
    const envObj = env as Record<string, unknown>;
    const token = Capacitor.isNativePlatform()
      ? normalizeToken(envObj.VITE_MAPBOX_TOKEN_MOBILE)
      : normalizeToken(envObj.VITE_MAPBOX_TOKEN_WEB);
    return token || undefined;
  } catch {
    return undefined;
  }
}

export function looksLikePublicToken(t?: string) {
  return !!t && /^pk\.[A-Za-z0-9._-]{10,}$/.test(t);
}