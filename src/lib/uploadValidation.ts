/**
 * Upload Validation - Stage 2 Security
 * Validates file types and content for secure uploads
 */

/**
 * Allowed file types for different upload modes
 */
export const ALLOWED_FILE_TYPES = {
  CSV_ONLY: ['text/csv', 'application/csv'],
  EXCEL_AND_CSV: [
    'text/csv', 
    'application/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ]
} as const;

/**
 * File extension mappings
 */
export const FILE_EXTENSIONS = {
  CSV: ['.csv'],
  EXCEL: ['.xlsx', '.xls']
} as const;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fileType: 'csv' | 'excel' | 'unknown';
}

/**
 * Environment variable for XLSX support
 * Defaults to false (CSV only) for security
 */
export function isXlsxEnabled(): boolean {
  // Check if VITE_ENABLE_XLSX is explicitly set to 'true'
  return import.meta.env.VITE_ENABLE_XLSX === 'true';
}

/**
 * Validates file type based on MIME type and extension
 * @param file - The file to validate
 * @returns Validation result
 */
export function validateFileType(file: File): ValidationResult {
  const xlsxEnabled = isXlsxEnabled();
  const allowedTypes = xlsxEnabled ? ALLOWED_FILE_TYPES.EXCEL_AND_CSV : ALLOWED_FILE_TYPES.CSV_ONLY;
  
  // Check MIME type
  const isValidMimeType = allowedTypes.includes(file.type as (typeof allowedTypes)[number]);
  
  // Check file extension as backup
  const fileName = file.name.toLowerCase();
  const isCsv = FILE_EXTENSIONS.CSV.some(ext => fileName.endsWith(ext));
  const isExcel = FILE_EXTENSIONS.EXCEL.some(ext => fileName.endsWith(ext));
  
  // Determine file type
  let fileType: 'csv' | 'excel' | 'unknown' = 'unknown';
  if (isCsv || file.type.includes('csv')) {
    fileType = 'csv';
  } else if (isExcel || file.type.includes('spreadsheet') || file.type.includes('ms-excel')) {
    fileType = 'excel';
  }
  
  // Validate based on enabled features
  if (fileType === 'csv') {
    return { isValid: true, fileType: 'csv' };
  }
  
  if (fileType === 'excel' && xlsxEnabled) {
    return { isValid: true, fileType: 'excel' };
  }
  
  if (fileType === 'excel' && !xlsxEnabled) {
    return { 
      isValid: false, 
      error: 'xlsxDisabledCsvAvailable',
      fileType: 'excel' 
    };
  }
  
  return { 
    isValid: false, 
    error: 'unsupportedFileType',
    fileType: 'unknown' 
  };
}

/**
 * Validates if file content appears to be legitimate CSV
 * @param content - File content as string
 * @returns True if content appears to be valid CSV
 */
export function validateCsvContent(content: string): boolean {
  if (!content || content.trim().length === 0) {
    return false;
  }
  
  // Basic CSV structure validation
  const lines = content.split('\n');
  if (lines.length < 1) {
    return false;
  }
  
  // Check for reasonable CSV structure
  // At least one line should contain commas or semicolons (common CSV separators)
  const hasStructure = lines.some(line => 
    line.includes(',') || line.includes(';') || line.includes('\t')
  );
  
  return hasStructure;
}

/**
 * Comprehensive file validation for uploads
 * @param file - The file to validate
 * @returns Promise resolving to validation result
 */
export async function validateUploadFile(file: File): Promise<ValidationResult> {
  // First check file type
  const typeValidation = validateFileType(file);
  if (!typeValidation.isValid) {
    return typeValidation;
  }
  
  // For CSV files, do additional content validation
  if (typeValidation.fileType === 'csv') {
    try {
      const content = await file.text();
      const isValidContent = validateCsvContent(content);
      
      if (!isValidContent) {
        return {
          isValid: false,
          error: 'invalidCsvContent',
          fileType: 'csv'
        };
      }
    } catch (error) {
      return {
        isValid: false,
        error: 'fileReadError',
        fileType: 'csv'
      };
    }
  }
  
  return typeValidation;
}