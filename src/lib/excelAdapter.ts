/**
 * Excel adapter with secure file handling and defensive parsing
 */
import * as XLSX from 'xlsx';

export interface WorksheetData {
  name: string;
  data: unknown[][];
}

export interface ExcelReadResult {
  worksheets: WorksheetData[];
  success: boolean;
  error?: string;
}

/**
 * Safely coerce unknown values to primitives, avoiding prototype pollution
 */
function coerceToPrimitive(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  // Convert objects to string representation safely
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  
  return String(value);
}

/**
 * Sanitize keys to prevent prototype pollution
 */
function sanitizeKey(key: unknown): string {
  if (typeof key !== 'string') {
    return String(key);
  }
  
  // Prevent prototype pollution
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return `_${key}`;
  }
  
  return key;
}

/**
 * Read Excel file from ArrayBuffer with defensive parsing
 */
export async function readExcelFile(buffer: ArrayBuffer): Promise<ExcelReadResult> {
  if (!buffer || buffer.byteLength === 0) {
    return {
      worksheets: [],
      success: false,
      error: 'Empty or invalid buffer'
    };
  }

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: 'array',
      codepage: 65001, // UTF-8
      cellDates: true,
      cellNF: false,
      cellHTML: false // Prevent HTML injection
    });
  } catch (error) {
    console.error('[excelAdapter] read error', error);
    return {
      worksheets: [],
      success: false,
      error: String((error as Error)?.message ?? error)
    };
  }

  const worksheets: WorksheetData[] = [];

  // Process each worksheet
  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    try {
      // Convert to JSON with safe parsing
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1, // Array of arrays
        defval: null,
        blankrows: false
      });

      // Sanitize the data
      const sanitizedData = jsonData.map((row: unknown) => {
        if (!Array.isArray(row)) {
          return [];
        }
        return row.map(coerceToPrimitive);
      });

      worksheets.push({
        name: sanitizeKey(sheetName),
        data: sanitizedData
      });
    } catch (sheetError) {
      console.warn(`Error processing sheet ${sheetName}:`, sheetError);
      // Continue with other sheets
    }
  }

  return {
    worksheets,
    success: true
  };
}

/**
 * Write Excel file to Blob with proper data handling
 */
export async function writeExcelFile(worksheets: WorksheetData[]): Promise<Blob> {
  try {
    if (!worksheets || worksheets.length === 0) {
      throw new Error('No worksheets provided');
    }

    // Create new workbook
    const workbook = XLSX.utils.book_new();

    for (const { name, data } of worksheets) {
      if (!Array.isArray(data)) {
        console.warn(`Skipping invalid worksheet data for: ${name}`);
        continue;
      }

      // Sanitize worksheet name
      const safeName = sanitizeKey(name).substring(0, 31); // Excel limit

      // Create worksheet from array of arrays
      const sanitizedData = data.map(row => {
        if (!Array.isArray(row)) {
          return [];
        }
        return row.map(coerceToPrimitive);
      });

      const worksheet = XLSX.utils.aoa_to_sheet(sanitizedData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
    }

    // Write to buffer
    const buffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      compression: true
    });

    // Create blob
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

  } catch (error) {
    console.error('Error writing Excel file:', error);
    throw error;
  }
}

/**
 * Create a simple worksheet from key-value data
 */
export function createWorksheetFromData(data: Record<string, unknown>[]): unknown[][] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  // Get all unique keys safely
  const allKeys = new Set<string>();
  for (const item of data) {
    if (item && typeof item === 'object') {
      Object.keys(item).forEach(key => {
        allKeys.add(sanitizeKey(key));
      });
    }
  }

  const headers = Array.from(allKeys);
  const rows: unknown[][] = [headers];

  // Convert data rows
  for (const item of data) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const row = headers.map(header => {
      const value = (item as Record<string, unknown>)[header];
      return coerceToPrimitive(value);
    });
    
    rows.push(row);
  }

  return rows;
}