import { Capacitor } from '@capacitor/core';

function normalizeToken(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.trim();
}

export function getMapboxToken(): string | undefined {
  try {
    const ui = typeof window !== 'undefined'
      ? normalizeToken(localStorage.getItem('mapbox_token'))
      : '';
    if (ui) return ui;

    // Native → mobiler Token; Web → Web-Token
    const env = (import.meta as { env?: Record<string, unknown> }).env;
    const token = Capacitor.isNativePlatform()
      ? normalizeToken(env?.VITE_MAPBOX_TOKEN_MOBILE)
      : normalizeToken(env?.VITE_MAPBOX_TOKEN_WEB);
    return token || undefined;
  } catch {
    return undefined;
  }
}

export function looksLikePublicToken(t?: string) {
  return !!t && /^pk\.[A-Za-z0-9._-]+$/.test(t);
}