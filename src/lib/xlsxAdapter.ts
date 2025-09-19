/**
 * XLSX Adapter - Isolates XLSX usage with security mitigations
 * 
 * TODO: Migrate to existing `exceljs` implementation in PR2; remove XLSX.
 * 
 * This adapter provides:
 * - Dynamic import of XLSX only when needed
 * - Input validation and sanitization to prevent prototype pollution
 * - Deep cloning of plain objects and prototype freezing
 * - Boundary isolation - no raw XLSX types exported
 */

// Safe types that can be exported from this adapter
export interface SafeWorksheet {
  [cell: string]: any;
  '!ref'?: string;
  '!margins'?: any;
  '!page'?: any;
  '!printArea'?: string;
  '!pageBreaks'?: any;
  '!protect'?: any;
  '!rows'?: any[];
}

export interface SafeWorkbook {
  SheetNames: string[];
  Sheets: { [name: string]: SafeWorksheet };
}

export interface ParsedExcelData {
  sheets: Array<{
    name: string;
    data: any[][];
    rowCount: number;
  }>;
  totalRows: number;
}

/**
 * Deep clone an object to prevent prototype pollution
 */
function deepClonePlainObject(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClonePlainObject(item));
  }
  
  // Only clone plain objects
  if (obj.constructor !== Object) {
    return obj;
  }
  
  const cloned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClonePlainObject(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Sanitize input data to prevent prototype pollution
 */
function sanitizeInput(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // Deep clone to prevent prototype pollution
  const sanitized = deepClonePlainObject(data);
  
  // Freeze prototype to prevent manipulation
  if (sanitized && typeof sanitized === 'object') {
    Object.freeze(Object.getPrototypeOf(sanitized));
  }
  
  return sanitized;
}

/**
 * Create a new workbook
 */
export async function createWorkbook(): Promise<SafeWorkbook> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  
  return sanitizeInput({
    SheetNames: workbook.SheetNames || [],
    Sheets: workbook.Sheets || {}
  });
}

/**
 * Create worksheet from array of arrays
 */
export async function createWorksheetFromAOA(data: any[][]): Promise<SafeWorksheet> {
  const XLSX = await import('xlsx');
  const sanitizedData = sanitizeInput(data);
  const worksheet = XLSX.utils.aoa_to_sheet(sanitizedData);
  
  return sanitizeInput(worksheet);
}

/**
 * Append worksheet to workbook
 */
export async function appendSheetToWorkbook(
  workbook: SafeWorkbook, 
  worksheet: SafeWorksheet, 
  sheetName: string
): Promise<void> {
  const XLSX = await import('xlsx');
  const sanitizedWorkbook = sanitizeInput(workbook);
  const sanitizedWorksheet = sanitizeInput(worksheet);
  const sanitizedSheetName = String(sheetName).substring(0, 31); // Excel limit
  
  XLSX.utils.book_append_sheet(sanitizedWorkbook, sanitizedWorksheet, sanitizedSheetName);
  
  // Update the safe workbook reference
  workbook.SheetNames = sanitizedWorkbook.SheetNames;
  workbook.Sheets = sanitizedWorkbook.Sheets;
}

/**
 * Write workbook to buffer
 */
export async function writeWorkbookToBuffer(
  workbook: SafeWorkbook, 
  options: { type: 'array' | 'buffer'; bookType: 'xlsx' } = { type: 'array', bookType: 'xlsx' }
): Promise<ArrayBuffer> {
  const XLSX = await import('xlsx');
  const sanitizedWorkbook = sanitizeInput(workbook);
  const sanitizedOptions = sanitizeInput(options);
  
  return XLSX.write(sanitizedWorkbook, sanitizedOptions);
}

/**
 * Parse Excel file from ArrayBuffer
 */
export async function parseExcelFile(buffer: ArrayBuffer): Promise<ParsedExcelData> {
  const XLSX = await import('xlsx');
  const sanitizedBuffer = buffer.slice(); // Create a copy
  
  const workbook = XLSX.read(sanitizedBuffer, { type: 'array' });
  
  const sheets = workbook.SheetNames.map(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    return {
      name: String(sheetName),
      data: sanitizeInput(data),
      rowCount: Array.isArray(data) ? data.length : 0
    };
  });
  
  return sanitizeInput({
    sheets,
    totalRows: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0)
  });
}

/**
 * Create worksheet from JSON data
 */
export async function createWorksheetFromJSON(data: any[]): Promise<SafeWorksheet> {
  const XLSX = await import('xlsx');
  const sanitizedData = sanitizeInput(data);
  const worksheet = XLSX.utils.json_to_sheet(sanitizedData);
  
  return sanitizeInput(worksheet);
}

/**
 * Apply cell formatting utilities (simplified interface)
 */
export async function setCellValue(
  worksheet: SafeWorksheet, 
  cell: string, 
  value: any
): Promise<void> {
  const sanitizedCell = String(cell).substring(0, 10); // Reasonable cell reference limit
  const sanitizedValue = sanitizeInput(value);
  
  if (!worksheet[sanitizedCell]) {
    worksheet[sanitizedCell] = {};
  }
  
  worksheet[sanitizedCell].v = sanitizedValue;
  worksheet[sanitizedCell].t = typeof sanitizedValue === 'number' ? 'n' : 's';
}