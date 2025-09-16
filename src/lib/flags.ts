/**
 * Feature flags for travel-autolog application
 */

// XLSX import feature flag
export const ENABLE_XLSX = import.meta.env.VITE_ENABLE_XLSX_IMPORT === 'true';

/**
 * Check if XLSX import is enabled
 * @returns true if XLSX imports are allowed, false otherwise
 */
export function isXlsxEnabled(): boolean {
  return ENABLE_XLSX;
}