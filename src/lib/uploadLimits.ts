/**
 * Upload Limits Configuration
 * Reads environment variables with safe defaults
 */

interface UploadLimits {
  maxBytes: number;
  maxRows: number;
}

/**
 * Gets upload limits from environment variables with safe defaults
 * @returns Object containing maxBytes and maxRows limits
 */
export function getUploadLimits(): UploadLimits {
  // Default to 5MB in bytes
  const defaultMaxBytes = 5 * 1024 * 1024;
  // Default to 50,000 rows
  const defaultMaxRows = 50000;

  const maxSizeMB = import.meta.env.VITE_MAX_UPLOAD_SIZE_MB;
  const maxRows = import.meta.env.VITE_MAX_UPLOAD_ROWS;

  return {
    maxBytes: maxSizeMB ? parseInt(maxSizeMB, 10) * 1024 * 1024 : defaultMaxBytes,
    maxRows: maxRows ? parseInt(maxRows, 10) : defaultMaxRows
  };
}