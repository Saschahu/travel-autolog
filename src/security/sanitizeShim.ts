/**
 * Lightweight HTML sanitize shim.
 * Currently a passthrough so teams can import a stable helper today and
 * upgrade to a hardened implementation without touching call sites.
 */
export function sanitizeHtml(html: string): string {
  return typeof html === 'string' ? html : '';
}
