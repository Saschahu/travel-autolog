/**
 * Feature flags for the application
 */

export const ENABLE_XLSX = import.meta.env.VITE_ENABLE_XLSX_IMPORT === 'true';

/**
 * Check if XLSX import functionality is enabled
 * @returns {boolean} True if XLSX imports are enabled
 */
export function isXlsxEnabled(): boolean {
  return ENABLE_XLSX;
}