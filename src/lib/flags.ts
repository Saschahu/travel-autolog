/**
 * Feature flags configuration
 */

// XLSX Import Feature Flag
export const ENABLE_XLSX = import.meta.env.VITE_ENABLE_XLSX_IMPORT === 'true';

/**
 * Check if XLSX import functionality is enabled
 * @returns true if XLSX import is enabled, false otherwise
 */
export function isXlsxEnabled(): boolean {
  return ENABLE_XLSX;
}