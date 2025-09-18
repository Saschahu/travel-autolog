/**
 * Upload Validation and Limits
 * Validates file uploads based on size and row count limits
 */

/**
 * Default configuration values
 */
const DEFAULT_MAX_SIZE_MB = 5; // Changed from 5.2 to 5 MB as requested
const DEFAULT_MAX_ROWS = 50000;

/**
 * Get maximum upload size in bytes from environment variable
 */
export function getMaxUploadSizeBytes(): number {
  const envValue = import.meta.env.VITE_MAX_UPLOAD_SIZE_MB;
  const sizeMB = envValue ? parseInt(envValue, 10) : DEFAULT_MAX_SIZE_MB;
  return sizeMB * 1024 * 1024; // Convert MB to bytes
}

/**
 * Get maximum rows limit from environment variable
 */
export function getMaxUploadRows(): number {
  const envValue = import.meta.env.VITE_MAX_UPLOAD_ROWS;
  return envValue ? parseInt(envValue, 10) : DEFAULT_MAX_ROWS;
}

/**
 * Check if XLSX upload is enabled
 */
export function isXlsxEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_XLSX === 'true';
}

/**
 * Validation result interface
 */
export interface UploadValidationResult {
  isValid: boolean;
  error?: 'tooLarge' | 'tooManyRows' | 'xlsxDisabled';
  details?: {
    fileSize?: number;
    maxSize?: number;
    rowCount?: number;
    maxRows?: number;
  };
}

/**
 * Validates file size before parsing
 * @param file - The file to validate
 * @returns Validation result
 */
export function validateFileSize(file: File): UploadValidationResult {
  const maxSize = getMaxUploadSizeBytes();
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'tooLarge',
      details: {
        fileSize: file.size,
        maxSize: maxSize
      }
    };
  }
  
  return { isValid: true };
}

/**
 * Validates file type and XLSX permission
 * @param file - The file to validate
 * @returns Validation result
 */
export function validateFileType(file: File): UploadValidationResult {
  const isXlsx = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                 file.type === 'application/vnd.ms-excel' ||
                 file.name.toLowerCase().endsWith('.xlsx') ||
                 file.name.toLowerCase().endsWith('.xls');
  
  const isCsv = file.type === 'text/csv' || 
                file.name.toLowerCase().endsWith('.csv');
  
  // CSV is always allowed
  if (isCsv) {
    return { isValid: true };
  }
  
  // XLSX requires permission
  if (isXlsx && !isXlsxEnabled()) {
    return {
      isValid: false,
      error: 'xlsxDisabled'
    };
  }
  
  if (isXlsx) {
    return { isValid: true };
  }
  
  // Unsupported file type
  return { isValid: false };
}

/**
 * Validates row count after parsing
 * @param rowCount - Number of rows in the parsed data
 * @returns Validation result
 */
export function validateRowCount(rowCount: number): UploadValidationResult {
  const maxRows = getMaxUploadRows();
  
  if (rowCount > maxRows) {
    return {
      isValid: false,
      error: 'tooManyRows',
      details: {
        rowCount: rowCount,
        maxRows: maxRows
      }
    };
  }
  
  return { isValid: true };
}

/**
 * Comprehensive upload validation
 * @param file - The file to validate
 * @param rowCount - Optional row count (if already parsed)
 * @returns Validation result
 */
export function validateUpload(file: File, rowCount?: number): UploadValidationResult {
  // First check file type and permissions
  const typeValidation = validateFileType(file);
  if (!typeValidation.isValid) {
    return typeValidation;
  }
  
  // Then check file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }
  
  // Finally check row count if provided
  if (rowCount !== undefined) {
    const rowValidation = validateRowCount(rowCount);
    if (!rowValidation.isValid) {
      return rowValidation;
    }
  }
  
  return { isValid: true };
}