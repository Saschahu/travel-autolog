import type { TFunction } from 'i18next';

/**
 * Safe translation helper that prevents i18n keys from showing in the UI.
 * If a translation is missing, it shows the fallback text instead of the key.
 */
export function tt(t: TFunction, key: string, fallback: string): string {
  const value = t(key);
  // If the translation function returns the key itself, it means the translation is missing
  return value === key ? fallback : value;
}