/**
 * String utility functions
 */

export function sanitizeFileName(filename: string): string {
  // Replace invalid filename characters with underscore
  return filename
    .replace(/[/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}