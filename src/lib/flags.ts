/**
 * Feature flags for the application
 */

export const ENABLE_XLSX = import.meta.env.VITE_ENABLE_XLSX_IMPORT === 'true';

export function isXlsxEnabled(): boolean {
  return ENABLE_XLSX;
}