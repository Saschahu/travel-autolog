/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_XLSX_IMPORT?: string;
  // Add other env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Excel parsing interfaces
export interface ExcelSheetData {
  name: string;
  data: unknown[];
  rowCount: number;
}

export interface ExcelParseResult {
  sheets: ExcelSheetData[];
  totalSheets: number;
  totalRows: number;
}
