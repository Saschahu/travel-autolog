/**
 * Upload limits configuration with environment variable overrides
 * Security-first defaults with strict parsing
 */

/**
 * Get maximum allowed file size in bytes
 * @returns Maximum file size in bytes (default: 5MB)
 */
export function getUploadMaxBytes(): number {
  const envValue = import.meta.env.VITE_UPLOAD_MAX_BYTES;
  
  if (!envValue) {
    return 5 * 1024 * 1024; // 5MB default
  }
  
  const parsed = parseInt(envValue, 10);
  
  // Strict validation: negative values or NaN fall back to default
  if (isNaN(parsed) || parsed < 0) {
    return 5 * 1024 * 1024; // 5MB default
  }
  
  return parsed;
}

/**
 * Get maximum allowed row count
 * @returns Maximum row count (default: 50000)
 */
export function getUploadMaxRows(): number {
  const envValue = import.meta.env.VITE_UPLOAD_MAX_ROWS;
  
  if (!envValue) {
    return 50000; // 50k rows default
  }
  
  const parsed = parseInt(envValue, 10);
  
  // Strict validation: negative values or NaN fall back to default
  if (isNaN(parsed) || parsed < 0) {
    return 50000; // 50k rows default
  }
  
  return parsed;
}

/**
 * Get XLSX import feature flag status
 * @returns Whether XLSX import is enabled (default: false)
 */
export function getXlsxImportEnabled(): boolean {
  const envValue = import.meta.env.VITE_ENABLE_XLSX_IMPORT;
  
  if (!envValue) {
    return false; // Default: disabled
  }
  
  return envValue.toLowerCase() === 'true';
}