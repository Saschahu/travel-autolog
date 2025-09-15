export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export type CsvErrorCode = 'FILE_TOO_LARGE' | 'ROW_TOO_LONG' | 'INVALID_CSV' | 'UNSAFE_CELL';

export class CsvError extends Error {
  code: CsvErrorCode;
  
  constructor(code: CsvErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'CsvError';
  }
}

export async function parseCsv(file: File): Promise<CsvParseResult> {
  // Check file size limit (2MB)
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new CsvError('FILE_TOO_LARGE', `File size ${file.size} bytes exceeds maximum of ${MAX_FILE_SIZE} bytes`);
  }

  // Read file as UTF-8 text
  let text = await file.text();
  
  // Remove BOM if present
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  // Split into lines, handling both CRLF and LF
  const lines = text.split(/\r?\n/);
  
  // Find delimiter by analyzing first 5 non-empty lines
  const delimiter = detectDelimiter(lines);
  
  // Parse lines
  const parsedLines: string[][] = [];
  const MAX_ROW_LENGTH = 10_000;
  
  for (const line of lines) {
    if (line.trim() === '') continue; // Skip empty lines
    
    if (line.length > MAX_ROW_LENGTH) {
      throw new CsvError('ROW_TOO_LONG', `Row length ${line.length} exceeds maximum of ${MAX_ROW_LENGTH} characters`);
    }
    
    const parsedRow = parseRow(line, delimiter);
    parsedLines.push(parsedRow);
  }
  
  if (parsedLines.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }
  
  // First line is headers
  const headers = parsedLines[0].map(header => header.trim());
  const dataRows = parsedLines.slice(1);
  
  // Build rows as object mapping
  const rows: Record<string, string>[] = [];
  
  for (const row of dataRows) {
    const rowObject: Record<string, string> = {};
    
    // Ensure same column count - pad missing columns with empty strings
    for (let i = 0; i < headers.length; i++) {
      let cellValue = i < row.length ? row[i] : '';
      
      // Handle formula injection prevention
      if (cellValue && /^[=+\-@']/.test(cellValue)) {
        cellValue = '\u200B' + cellValue; // Prefix with zero-width space
      }
      
      rowObject[headers[i]] = cellValue;
    }
    
    // If row has more columns than headers, we could merge excess or throw error
    // For now, let's just ignore excess columns to keep it simple
    
    rows.push(rowObject);
  }
  
  return {
    headers,
    rows,
    totalRows: rows.length
  };
}

function detectDelimiter(lines: string[]): string {
  const delimiters = [',', ';', '\t'];
  const testLines = lines.filter(line => line.trim() !== '').slice(0, 5);
  
  if (testLines.length === 0) {
    return ','; // Default to comma
  }
  
  let bestDelimiter = ',';
  let maxCount = 0;
  
  for (const delimiter of delimiters) {
    let totalCount = 0;
    for (const line of testLines) {
      totalCount += countDelimiterOccurrences(line, delimiter);
    }
    
    if (totalCount > maxCount) {
      maxCount = totalCount;
      bestDelimiter = delimiter;
    }
  }
  
  return bestDelimiter;
}

function countDelimiterOccurrences(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Handle escaped quotes
      if (i + 1 < line.length && line[i + 1] === '"') {
        i++; // Skip the next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      count++;
    }
  }
  
  return count;
}

function parseRow(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}