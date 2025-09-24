export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_LINE_LENGTH = 10_000; // 10k chars per line
const DELIMITERS = [',', ';', '\t'];
const ZERO_WIDTH_SPACE = '\u200B';

/**
 * Parses a CSV file with security limits and formula injection protection
 * @param file - The CSV file to parse
 * @returns Promise resolving to CsvParseResult
 * @throws Error for security violations or parsing errors
 */
export async function parseCsv(file: File): Promise<CsvParseResult> {
  // Check file size limit
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds limit. Maximum allowed: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  // Read file as text (UTF-8)
  let text: string;
  try {
    text = await file.text();
  } catch (error) {
    throw new Error('Failed to read file as UTF-8 text');
  }

  // Split into lines and check line length limits
  const lines = text.split(/\r?\n/);
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > MAX_LINE_LENGTH) {
      throw new Error(`Line ${i + 1} exceeds maximum length of ${MAX_LINE_LENGTH} characters`);
    }
  }

  // Remove empty lines at the end
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  if (lines.length === 0) {
    throw new Error('File is empty or contains no valid data');
  }

  // Detect delimiter by counting occurrences in first few non-empty lines
  const delimiter = detectDelimiter(lines);
  
  // Parse CSV data
  const parsedData = parseCSVContent(lines, delimiter);
  
  if (parsedData.length === 0) {
    throw new Error('No data rows found in CSV file');
  }

  // Extract headers (first row)
  const headers = Object.keys(parsedData[0]);
  
  // Convert to desired format and apply security filters
  const rows = parsedData.map(row => {
    const secureRow: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(row)) {
      // Apply formula injection protection
      secureRow[key] = sanitizeValue(value);
    }
    
    return secureRow;
  });

  return {
    headers,
    rows,
    totalRows: rows.length
  };
}

/**
 * Detects the most likely delimiter by counting occurrences in sample lines
 */
function detectDelimiter(lines: string[]): string {
  const sampleSize = Math.min(5, lines.length);
  const delimiterCounts: Record<string, number> = {};
  
  // Initialize counts
  DELIMITERS.forEach(delim => {
    delimiterCounts[delim] = 0;
  });

  // Count delimiters in first few non-empty lines
  for (let i = 0; i < sampleSize; i++) {
    const line = lines[i].trim();
    if (line === '') continue;
    
    DELIMITERS.forEach(delim => {
      delimiterCounts[delim] += countDelimiterInLine(line, delim);
    });
  }

  // Find delimiter with highest count
  let bestDelimiter = ','; // default fallback
  let maxCount = 0;
  
  for (const [delim, count] of Object.entries(delimiterCounts)) {
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delim;
    }
  }

  return bestDelimiter;
}

/**
 * Count delimiter occurrences, respecting quoted fields
 */
function countDelimiterInLine(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      // Handle escaped quotes
      if (i + 1 < line.length && line[i + 1] === '"') {
        i += 2; // Skip escaped quote
        continue;
      }
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      count++;
    }
    
    i++;
  }
  
  return count;
}

/**
 * Parse CSV content into array of record objects
 */
function parseCSVContent(lines: string[], delimiter: string): Record<string, string>[] {
  const result: Record<string, string>[] = [];
  let headers: string[] = [];
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex].trim();
    if (line === '') continue;
    
    const fields = parseCSVLine(line, delimiter);
    
    if (headers.length === 0) {
      // First non-empty line becomes headers
      headers = fields.map(field => field.trim());
      continue;
    }
    
    // Create row object
    const row: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const value = i < fields.length ? fields[i] : '';
      row[header] = value.trim();
    }
    
    result.push(row);
  }
  
  return result;
}

/**
 * Parse a single CSV line into fields, handling quoted content and CRLF
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote - add single quote to field
        currentField += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      fields.push(currentField);
      currentField = '';
    } else {
      // Add character to current field
      currentField += char;
    }
    
    i++;
  }
  
  // Add final field
  fields.push(currentField);
  
  return fields;
}

/**
 * Sanitize cell values to prevent formula injection
 * Prefixes dangerous characters with zero-width space
 */
function sanitizeValue(value: string): string {
  if (typeof value !== 'string') {
    return String(value);
  }
  
  const trimmed = value.trim();
  
  // Check for formula-like patterns
  if (trimmed.length > 0) {
    const firstChar = trimmed[0];
    if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@' || firstChar === "'") {
      // Prefix with zero-width space to neutralize formula
      return ZERO_WIDTH_SPACE + trimmed;
    }
  }
  
  return trimmed;
}