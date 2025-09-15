/**
 * Feature flags for the application
 */

/**
 * Check if XLSX import is enabled via environment variable
 * Default is false (opt-in for security)
 */
export function isXlsxEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_XLSX_IMPORT === 'true';
}