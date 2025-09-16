// Feature flags configuration
export const ENABLE_XLSX = import.meta.env.VITE_ENABLE_XLSX_IMPORT === 'true';

/**
 * Check if XLSX import functionality is enabled
 * @returns boolean indicating if XLSX imports are allowed
 */
export function isXlsxEnabled(): boolean {
  return ENABLE_XLSX;
}