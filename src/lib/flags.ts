/** Feature flag: gate XLSX import via Vite env */
export const ENABLE_XLSX = import.meta.env.VITE_ENABLE_XLSX_IMPORT === 'true';
export function isXlsxEnabled() { return ENABLE_XLSX; }
