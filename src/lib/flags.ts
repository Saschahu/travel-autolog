export const ENABLE_XLSX: boolean =
  import.meta.env?.VITE_ENABLE_XLSX_IMPORT === 'true';

export function isXlsxEnabled(): boolean {
  return ENABLE_XLSX;
}
