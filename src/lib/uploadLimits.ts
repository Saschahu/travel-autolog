// Upload limits for file processing security
// Configurable via environment variables with sensible defaults

const DEFAULT_MAX_BYTES = 5_242_880; // 5MB
const DEFAULT_MAX_ROWS = 50_000;

export const MAX_UPLOAD_BYTES =
  Number(import.meta.env.VITE_UPLOAD_MAX_BYTES) || DEFAULT_MAX_BYTES;
export const MAX_UPLOAD_ROWS =
  Number(import.meta.env.VITE_UPLOAD_MAX_ROWS) || DEFAULT_MAX_ROWS;

export function checkLimits(fileSize: number, rows: number) {
  if (fileSize > MAX_UPLOAD_BYTES) {
    return { ok: false as const, reason: 'size' as const };
  }
  if (rows > MAX_UPLOAD_ROWS) {
    return { ok: false as const, reason: 'rows' as const };
  }
  return { ok: true as const };
}