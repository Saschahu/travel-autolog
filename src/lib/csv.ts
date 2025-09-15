/**
 * CSV Parser Library
 * Provides functionality to parse CSV files without external dependencies
 */

export interface CsvParseResult {
  rows: Record<string, string>[]; // Header-based mapping
  delimiter: ',' | ';';
  rowCount: number;
}

/**
 * Auto-detects CSV delimiter by analyzing the header row
 * Returns the delimiter that results in more fields in the header
 */
function detectDelimiter(headerLine: string): ',' | ';' {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  
  return semicolonCount > commaCount ? ';' : ',';
}

/**
 * Parses a CSV line respecting quoted fields
 * Handles commas/semicolons inside quoted fields properly
 */
function parseCsvLine(line: string, delimiter: ',' | ';'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote inside quoted field
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === delimiter && !inQuotes) {
      // Field separator outside quotes
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

/**
 * Parses a CSV file and returns structured data
 * @param file - The CSV file to parse
 * @returns Promise<CsvParseResult> - Parsed CSV data with header-based row mapping
 */
export async function parseCsv(file: File): Promise<CsvParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        if (lines.length === 0) {
          resolve({
            rows: [],
            delimiter: ',',
            rowCount: 0
          });
          return;
        }
        
        // Auto-detect delimiter from header line
        const delimiter = detectDelimiter(lines[0]);
        
        // Parse header row
        const headers = parseCsvLine(lines[0], delimiter).map(header => header.trim());
        
        // Parse data rows
        const rows: Record<string, string>[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i], delimiter);
          const row: Record<string, string> = {};
          
          // Map values to headers
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          rows.push(row);
        }
        
        resolve({
          rows,
          delimiter,
          rowCount: rows.length
        });
      } catch (error) {
        reject(new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file, 'utf-8');
  });
}