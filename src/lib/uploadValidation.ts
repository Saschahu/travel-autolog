/**
 * Upload Validation
 * Pre and post validation for file uploads
 */

interface UploadLimits {
  maxBytes: number;
  maxRows: number;
}

interface ValidationSuccess {
  ok: true;
}

interface ValidationError {
  ok: false;
  code: string;
  details: Record<string, any>;
}

type ValidationResult = ValidationSuccess | ValidationError;

/**
 * Pre-validates file size before processing
 * @param file - The file to validate
 * @param limits - Upload limits configuration
 * @returns Validation result
 */
export function preValidateFile(file: File, limits: UploadLimits): ValidationResult {
  if (file.size > limits.maxBytes) {
    return {
      ok: false,
      code: 'TOO_LARGE',
      details: { maxMB: Math.round(limits.maxBytes / (1024 * 1024)) }
    };
  }

  return { ok: true };
}

/**
 * Post-validates row count after parsing
 * @param rowCount - Number of rows in the parsed file
 * @param limits - Upload limits configuration
 * @returns Validation result
 */
export function postValidateRows(rowCount: number, limits: UploadLimits): ValidationResult {
  if (rowCount > limits.maxRows) {
    return {
      ok: false,
      code: 'TOO_MANY_ROWS',
      details: { maxRows: limits.maxRows }
    };
  }

  return { ok: true };
}