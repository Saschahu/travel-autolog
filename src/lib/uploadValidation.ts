/**
 * Upload validation utilities for file size and row count limits
 */

import { getUploadMaxBytes, getUploadMaxRows } from './uploadLimits';

export interface ValidationSuccess {
  ok: true;
}

export interface FileSizeError {
  ok: false;
  code: 'too_large';
  limitMB: number;
}

export interface RowCountError {
  ok: false;
  code: 'too_many_rows';
  limit: number;
}

export type ValidationResult = ValidationSuccess | FileSizeError | RowCountError;

/**
 * Validate file size against configured limit
 * @param file - The file to validate
 * @param maxBytes - Optional override for max bytes (defaults to env config)
 * @returns Validation result
 */
export function validateFileSize(file: File, maxBytes?: number): ValidationSuccess | FileSizeError {
  const limit = maxBytes ?? getUploadMaxBytes();
  
  if (file.size > limit) {
    return {
      ok: false,
      code: 'too_large',
      limitMB: Math.round(limit / (1024 * 1024))
    };
  }
  
  return { ok: true };
}

/**
 * Validate row count against configured limit
 * @param rowCount - Number of rows to validate
 * @param maxRows - Optional override for max rows (defaults to env config)
 * @returns Validation result
 */
export function validateRowCount(rowCount: number, maxRows?: number): ValidationSuccess | RowCountError {
  const limit = maxRows ?? getUploadMaxRows();
  
  if (rowCount > limit) {
    return {
      ok: false,
      code: 'too_many_rows',
      limit
    };
  }
  
  return { ok: true };
}