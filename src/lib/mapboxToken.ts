// @ts-nocheck
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

    // Environment variable handling
    const env = import.meta.env as unknown;
    if (!env || typeof env !== 'object') return undefined;
    
    const envObj = env as Record<string, unknown>;
    
    // Check for web preview mode first
    if (normalizeToken(envObj.VITE_WEB_PREVIEW) === '1') {
      const webPreviewToken = normalizeToken(envObj.VITE_MAPBOX_TOKEN);
      if (webPreviewToken) return webPreviewToken;
    }
    
    // Native → mobiler Token; Web → Web-Token
    const token = Capacitor.isNativePlatform()
      ? normalizeToken(envObj.VITE_MAPBOX_TOKEN_MOBILE)
      : normalizeToken(envObj.VITE_MAPBOX_TOKEN_WEB);
      
    // Fallback to generic VITE_MAPBOX_TOKEN
    return token || normalizeToken(envObj.VITE_MAPBOX_TOKEN) || undefined;
  } catch {
    return undefined;
  }
}

export function looksLikePublicToken(t?: string) {
  return !!t && /^pk\.[A-Za-z0-9._-]{10,}$/.test(t);
}

/**
 * Check if we're in web preview mode
 */
export function isWebPreview(): boolean {
  try {
    const env = import.meta.env as Record<string, unknown>;
    return normalizeToken(env?.VITE_WEB_PREVIEW) === '1';
  } catch {
    return false;
  }
}