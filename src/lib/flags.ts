// Feature flags for the application
// Security-first approach: features are opt-in by default

export const ENABLE_XLSX =
  import.meta.env.VITE_ENABLE_XLSX_IMPORT === 'true'; // default: false

export function isXlsxEnabled(): boolean {
  return ENABLE_XLSX;
}