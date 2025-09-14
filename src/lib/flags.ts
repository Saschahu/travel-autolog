/**
 * Feature flags configuration
 */

// XLSX import feature flag - disabled by default for security
export const ENABLE_XLSX = import.meta.env.VITE_ENABLE_XLSX_IMPORT === 'true';

/**
 * Check if XLSX import functionality is enabled
 * @returns boolean indicating if XLSX import is allowed
 */
export function isXlsxEnabled(): boolean {
  return ENABLE_XLSX;
}