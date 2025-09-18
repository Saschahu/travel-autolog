/**
 * CSV Sanitizer - Stage 2 Security
 * Sanitizes CSV data to prevent formula injection attacks
 */

/**
 * Characters that can start dangerous formulas in CSV/Excel
 */
const DANGEROUS_FORMULA_PREFIXES = ['=', '+', '-', '@'];

/**
 * Sanitizes a single cell value to prevent formula injection
 * @param value - The cell value to sanitize
 * @returns Sanitized value with dangerous formulas escaped
 */
export function sanitizeCellValue(value: string): string {
  if (typeof value !== 'string' || !value) {
    return value;
  }

  const trimmedValue = value.trim();
  
  // Check if the value starts with a dangerous character
  if (DANGEROUS_FORMULA_PREFIXES.some(prefix => trimmedValue.startsWith(prefix))) {
    // Escape by adding a single quote at the beginning
    return `'${value}`;
  }

  return value;
}

/**
 * Sanitizes a complete CSV record (row of data)
 * @param record - Object representing a CSV row
 * @returns Sanitized record with all dangerous formulas escaped
 */
export function sanitizeRecord(record: Record<string, unknown>): Record<string, unknown> {
  const sanitizedRecord: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string') {
      sanitizedRecord[key] = sanitizeCellValue(value);
    } else {
      sanitizedRecord[key] = value;
    }
  }

  return sanitizedRecord;
}

/**
 * Checks if a value was sanitized (contains escaped formula)
 * @param original - Original value
 * @param sanitized - Sanitized value
 * @returns True if the value was sanitized
 */
export function wasSanitized(original: string, sanitized: string): boolean {
  if (typeof original !== 'string' || typeof sanitized !== 'string') {
    return false;
  }

  const trimmedOriginal = original.trim();
  return DANGEROUS_FORMULA_PREFIXES.some(prefix => trimmedOriginal.startsWith(prefix)) 
    && sanitized.startsWith("'");
}

/**
 * Counts how many values in a record were sanitized
 * @param originalRecord - Original record
 * @param sanitizedRecord - Sanitized record
 * @returns Number of sanitized values
 */
export function countSanitizedValues(
  originalRecord: Record<string, unknown>, 
  sanitizedRecord: Record<string, unknown>
): number {
  let count = 0;
  
  for (const key of Object.keys(originalRecord)) {
    if (wasSanitized(String(originalRecord[key] || ''), String(sanitizedRecord[key] || ''))) {
      count++;
    }
  }
  
  return count;
}