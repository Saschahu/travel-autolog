/**
 * CSV Formula Injection Sanitizer
 * Prevents CSV Formula Injection attacks by escaping dangerous prefixes
 */

const DANGEROUS_PREFIXES = ['=', '+', '-', '@'] as const;

/**
 * Sanitize a single cell value to prevent CSV formula injection
 * @param value - The cell value to sanitize
 * @returns Sanitized string value
 */
export function sanitizeCell(value: unknown): string {
  if (value == null) return '';
  
  const s = String(value);
  
  // Check if the string starts with any dangerous prefix
  const isDangerous = DANGEROUS_PREFIXES.some(prefix => s.startsWith(prefix));
  
  // If dangerous, prepend with single quote to escape the formula
  return isDangerous ? `'${s}` : s;
}

/**
 * Sanitize all fields in a record/row object
 * @param row - The record object to sanitize
 * @returns New record with all string values sanitized
 */
export function sanitizeRecord<T extends Record<string, unknown>>(row: T): Record<string, string> {
  const sanitizedRecord: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(row)) {
    sanitizedRecord[key] = sanitizeCell(value);
  }
  
  return sanitizedRecord;
}