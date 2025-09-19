import { Capacitor } from '@capacitor/core';
import { getToken } from '@/security/tokenStorage';

export async function getMapboxToken(): Promise<string | undefined> {
  try {
    // First try to get token from secure storage
    const storedToken = await getToken();
    if (storedToken) return storedToken;

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