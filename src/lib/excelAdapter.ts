// Excel adapter with basic read/write operations and type safety

export interface CellValue {
  value: string | number | boolean | Date | null;
  type: 'string' | 'number' | 'boolean' | 'date' | 'null';
}

export interface WorksheetData {
  name: string;
  rows: CellValue[][];
}

export interface WorkbookData {
  worksheets: WorksheetData[];
}

// Coerce non-primitive values to safe types
export function coerceToSafeValue(input: any): CellValue {
  if (input === null || input === undefined) {
    return { value: null, type: 'null' };
  }
  
  if (typeof input === 'string') {
    return { value: input, type: 'string' };
  }
  
  if (typeof input === 'number' && isFinite(input)) {
    return { value: input, type: 'number' };
  }
  
  if (typeof input === 'boolean') {
    return { value: input, type: 'boolean' };
  }
  
  if (input instanceof Date && !isNaN(input.getTime())) {
    return { value: input, type: 'date' };
  }
  
  // Convert anything else to string, but sanitize dangerous values
  const stringValue = String(input);
  return { value: stringValue, type: 'string' };
}

// Prevent __proto__ and constructor pollution
export function sanitizePropertyName(name: string): string {
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  if (dangerous.includes(name.toLowerCase())) {
    return '_' + name;
  }
  return name;
}

// Safe object creation without prototype pollution
export function createSafeObject<T = any>(): T {
  return Object.create(null) as T;
}

// Read minimal sheet data
export function readMinimalSheet(sheetData: any[][]): WorksheetData {
  const safeRows: CellValue[][] = [];
  
  for (const row of sheetData || []) {
    const safeRow: CellValue[] = [];
    for (const cell of row || []) {
      safeRow.push(coerceToSafeValue(cell));
    }
    safeRows.push(safeRow);
  }
  
  return {
    name: 'Sheet1',
    rows: safeRows
  };
}

// Write minimal sheet data
export function writeMinimalSheet(data: WorksheetData): any[][] {
  return data.rows.map(row => 
    row.map(cell => cell.value)
  );
}

// Mock Excel operations for testing
export class MockExcelAdapter {
  private workbooks: Map<string, WorkbookData> = new Map();
  
  async readWorkbook(path: string): Promise<WorkbookData> {
    const existing = this.workbooks.get(path);
    if (existing) return existing;
    
    // Return empty workbook
    return { worksheets: [] };
  }
  
  async writeWorkbook(path: string, data: WorkbookData): Promise<boolean> {
    try {
      // Validate data structure
      if (!data || !Array.isArray(data.worksheets)) {
        throw new Error('Invalid workbook data');
      }
      
      // Sanitize worksheet names
      const sanitizedData: WorkbookData = {
        worksheets: data.worksheets.map(ws => ({
          ...ws,
          name: sanitizePropertyName(ws.name || 'Sheet1')
        }))
      };
      
      this.workbooks.set(path, sanitizedData);
      return true;
    } catch {
      return false;
    }
  }
  
  getStoredWorkbooks(): string[] {
    return Array.from(this.workbooks.keys());
  }
  
  clearStorage(): void {
    this.workbooks.clear();
  }
}

// Export singleton instance for testing
export const mockExcelAdapter = new MockExcelAdapter();