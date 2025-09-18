/**
 * CSV Security Sanitizer - Stage 2
 * Sanitizes CSV cell values to prevent formula injection attacks
 */

/**
 * Dangerous prefixes that could be used for formula injection
 */
const DANGEROUS_PREFIXES = ['=', '+', '-', '@'];

/**
 * Sanitizes a single cell value by prefixing dangerous characters with single quote
 * @param value - The cell value to sanitize
 * @returns Sanitized cell value
 */
export function sanitizeCell(value: unknown): unknown {
  // Only process string values
  if (typeof value !== 'string') {
    return value;
  }

  // Check if the string starts with any dangerous prefix
  const trimmedValue = value.trim();
  if (trimmedValue.length > 0 && DANGEROUS_PREFIXES.includes(trimmedValue[0])) {
    return `'${value}`;
  }

  return value;
}

/**
 * Sanitizes all values in a record/row object
 * @param record - The record object to sanitize
 * @returns Sanitized record with same structure
 */
export function sanitizeRecord(record: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(record)) {
    sanitized[key] = sanitizeCell(value);
  }
  
  return sanitized;
}

/**
 * Sanitizes an array of records
 * @param records - Array of records to sanitize
 * @returns Array of sanitized records
 */
export function sanitizeRecords(records: Record<string, unknown>[]): Record<string, unknown>[] {
  return records.map(record => sanitizeRecord(record));
}

/**
 * Checks if any sanitization was applied to a record
 * @param original - Original record
 * @param sanitized - Sanitized record
 * @returns true if any values were modified
 */
export function hasSanitization(original: Record<string, unknown>, sanitized: Record<string, unknown>): boolean {
  for (const [key, originalValue] of Object.entries(original)) {
    if (originalValue !== sanitized[key]) {
      return true;
    }
  }
  return false;
}

/**
 * Checks if any records in an array were sanitized
 * @param originalRecords - Original records array
 * @param sanitizedRecords - Sanitized records array
 * @returns true if any sanitization was applied
 */
export function hasAnySanitization(originalRecords: Record<string, unknown>[], sanitizedRecords: Record<string, unknown>[]): boolean {
  for (let i = 0; i < originalRecords.length; i++) {
    if (hasSanitization(originalRecords[i], sanitizedRecords[i])) {
      return true;
    }
  }
  return false;
}