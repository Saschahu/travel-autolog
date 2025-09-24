/**
 * HTML Sanitizer Module
 * 
 * Provides safe HTML handling using DOMPurify with Trusted Types support
 * for CSP compliance and XSS prevention.
 */

// Dynamic import of DOMPurify to keep it out of initial bundle
let DOMPurify: typeof import('dompurify').default | null = null;

/**
 * Lazily load DOMPurify only when needed
 */
async function getDOMPurify() {
  if (!DOMPurify) {
    // Dynamic import to avoid loading DOMPurify in initial bundle
    const module = await import('dompurify');
    DOMPurify = module.default;
  }
  return DOMPurify;
}

/**
 * Sanitize HTML input using DOMPurify with strict settings
 * @param input - Raw HTML string to sanitize
 * @returns Sanitized HTML string safe for DOM insertion
 */
export async function sanitizeHtml(input: string): Promise<string> {
  const purify = await getDOMPurify();
  
  // Configure DOMPurify with strict settings for production
  return purify.sanitize(input, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    // Remove any script-related attributes
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
    // Remove script and style tags completely
    FORBID_TAGS: ['script', 'style', 'object', 'embed', 'iframe']
  });
}

/**
 * Create safe HTML for DOM insertion with Trusted Types support
 * @param input - Raw HTML string to sanitize
 * @returns TrustedHTML object if supported, otherwise sanitized string
 */
export async function toSafeHtml(input: string): Promise<TrustedHTML | string> {
  const sanitized = await sanitizeHtml(input);
  
  // Use Trusted Types if available
  if (typeof window !== 'undefined' && window.trustedTypes) {
    try {
      // Create or get existing policy
      const policy = window.trustedTypes.createPolicy('app#default', {
        createHTML: (input: string) => input // Input is already sanitized
      });
      
      return policy.createHTML(sanitized);
    } catch (error) {
      console.warn('Failed to create Trusted Types policy:', error);
      return sanitized;
    }
  }
  
  return sanitized;
}

/**
 * Synchronous HTML sanitization (fallback when async is not possible)
 * Note: This should be avoided in favor of the async version when possible
 * @param input - Raw HTML string to sanitize
 * @returns Sanitized HTML string (without DOMPurify if not loaded)
 */
export function sanitizeHtmlSync(input: string): string {
  if (!DOMPurify) {
    console.warn('DOMPurify not loaded, using basic sanitization');
    // Basic fallback sanitization (not as secure as DOMPurify)
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:/gi, '');
  }
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
    FORBID_TAGS: ['script', 'style', 'object', 'embed', 'iframe']
  });
}