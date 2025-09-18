/**
 * Upload Limits - Stage 2 Security
 * Enforces file size and row count limits for uploads
 */

/**
 * Default upload limits for security
 */
export const DEFAULT_LIMITS = {
  /** Maximum file size in bytes (5.2 MB) */
  MAX_FILE_SIZE: 5.2 * 1024 * 1024,
  /** Maximum number of rows (50,001 to trigger at 50,001) */
  MAX_ROWS: 50000,
} as const;

/**
 * Limit validation result interface
 */
export interface LimitValidationResult {
  isValid: boolean;
  error?: 'tooLarge' | 'tooManyRows';
  actualSize?: number;
  actualRows?: number;
  maxSize?: number;
  maxRows?: number;
}

/**
 * Gets upload limits from environment variables or defaults
 * @returns Current upload limits
 */
export function getUploadLimits() {
  const maxSizeMB = parseFloat(import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || '5.2');
  const maxRows = parseInt(import.meta.env.VITE_MAX_UPLOAD_ROWS || '50000', 10);
  
  return {
    maxFileSize: maxSizeMB * 1024 * 1024, // Convert MB to bytes
    maxRows: maxRows
  };
}

/**
 * Validates file size against limits
 * @param file - The file to validate
 * @returns Validation result
 */
export function validateFileSize(file: File): LimitValidationResult {
  const limits = getUploadLimits();
  
  if (file.size > limits.maxFileSize) {
    return {
      isValid: false,
      error: 'tooLarge',
      actualSize: file.size,
      maxSize: limits.maxFileSize
    };
  }
  
  return {
    isValid: true,
    actualSize: file.size,
    maxSize: limits.maxFileSize
  };
}

/**
 * Validates row count for CSV data
 * @param data - Array of CSV records or sheets data
 * @returns Validation result
 */
export function validateRowCount(data: unknown[] | { totalRows: number }): LimitValidationResult {
  const limits = getUploadLimits();
  
  let totalRows: number;
  
  // Handle different data formats
  if (Array.isArray(data)) {
    totalRows = data.length;
  } else if (typeof data === 'object' && 'totalRows' in data) {
    totalRows = data.totalRows;
  } else {
    return {
      isValid: false,
      error: 'tooManyRows',
      actualRows: 0,
      maxRows: limits.maxRows
    };
  }
  
  if (totalRows > limits.maxRows) {
    return {
      isValid: false,
      error: 'tooManyRows',
      actualRows: totalRows,
      maxRows: limits.maxRows
    };
  }
  
  return {
    isValid: true,
    actualRows: totalRows,
    maxRows: limits.maxRows
  };
}

/**
 * Comprehensive validation of file and content limits
 * @param file - The file to validate
 * @param data - Optional parsed data for row count validation
 * @returns Validation result
 */
export function validateUploadLimits(
  file: File, 
  data?: unknown[] | { totalRows: number }
): LimitValidationResult {
  // First validate file size
  const sizeValidation = validateFileSize(file);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }
  
  // If data is provided, validate row count
  if (data) {
    const rowValidation = validateRowCount(data);
    if (!rowValidation.isValid) {
      return {
        ...rowValidation,
        actualSize: sizeValidation.actualSize,
        maxSize: sizeValidation.maxSize
      };
    }
  }
  
  return {
    isValid: true,
    actualSize: sizeValidation.actualSize,
    maxSize: sizeValidation.maxSize,
    actualRows: data ? (Array.isArray(data) ? data.length : data.totalRows) : undefined,
    maxRows: getUploadLimits().maxRows
  };
}

/**
 * Formats file size for display
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "5.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats row count for display
 * @param rows - Number of rows
 * @returns Formatted row count string
 */
export function formatRowCount(rows: number): string {
  return rows.toLocaleString();
}