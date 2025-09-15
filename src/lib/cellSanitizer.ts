// Cell sanitizer to prevent formula injection attacks
// Protects against Excel/Google Sheets formula injection via CSV/XLSX imports

const DANGEROUS = /^[=+\-@]/; // Excel/Sheets formula injection patterns

export function sanitizeCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return DANGEROUS.test(s) ? `'${s}` : s;
}

export function sanitizeRecord<T extends Record<string, unknown>>(row: T): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k in row) {
    out[k] = sanitizeCell(row[k]);
  }
  return out;
}