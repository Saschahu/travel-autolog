/**
 * CSV Formula Sanitization
 * Prevents formula injection attacks by escaping dangerous cell prefixes
 */

const DANGEROUS_PREFIXES = ['=', '+', '-', '@'];

/**
 * Sanitizes a single cell value by prefixing dangerous formulas with a single quote
 * @param input - The cell value to sanitize
 * @returns The sanitized cell value
 */
export function sanitizeCell(input: string): string {
  if (typeof input !== 'string' || input.length === 0) {
    return input;
  }

  const trimmed = input.trim();
  if (DANGEROUS_PREFIXES.some(prefix => trimmed.startsWith(prefix))) {
    return `'${input}`;
  }

  return input;
}

/**
 * Sanitizes all string values in a record object
 * @param row - The record object to sanitize
 * @returns A new sanitized record object
 */
export function sanitizeRecord<T extends Record<string, unknown>>(row: T): T {
  const sanitized = { ...row } as Record<string, unknown>;
  
  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeCell(value);
    }
  }
  
  return sanitized as T;
}