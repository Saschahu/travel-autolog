/**
 * HTML sanitizer with Trusted Types support
 * Provides safe HTML sanitization with deferred DOMPurify loading
 */

// Trusted Types support check
export function supportsTrustedTypes(): boolean {
  return typeof window !== 'undefined' && 'trustedTypes' in window;
}

// Create a trusted type policy if supported
let trustedTypePolicy: TrustedTypePolicy | null = null;

if (supportsTrustedTypes()) {
  try {
    trustedTypePolicy = window.trustedTypes!.createPolicy('travel-autolog-sanitizer', {
      createHTML: (input: string) => input, // DOMPurify will sanitize before this
    });
  } catch (error) {
    console.warn('Could not create trusted type policy:', error);
  }
}

/**
 * Lazy load DOMPurify to avoid importing it at startup
 */
async function getDOMPurify(): Promise<typeof import('dompurify').default> {
  const { default: DOMPurify } = await import('dompurify');
  return DOMPurify;
}

/**
 * Basic HTML sanitization rules
 */
export const SAFE_HTML_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
  ALLOWED_ATTR: ['class', 'id'],
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea'],
  FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'style'],
};

/**
 * Sanitize HTML string removing dangerous elements and attributes
 */
export async function sanitizeHtml(html: string): Promise<string> {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const DOMPurify = await getDOMPurify();
    
    // Configure DOMPurify with safe settings
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: SAFE_HTML_CONFIG.ALLOWED_TAGS,
      ALLOWED_ATTR: SAFE_HTML_CONFIG.ALLOWED_ATTR,
      FORBID_TAGS: SAFE_HTML_CONFIG.FORBID_TAGS,
      FORBID_ATTR: SAFE_HTML_CONFIG.FORBID_ATTR,
      USE_PROFILES: { html: true },
    });
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    // Fallback: strip all tags
    return html.replace(/<[^>]*>/g, '');
  }
}

/**
 * Create safe HTML that can be used with Trusted Types
 * Returns TrustedHTML when supported, otherwise sanitized string
 */
export async function toSafeHtml(html: string): Promise<TrustedHTML | string> {
  const sanitized = await sanitizeHtml(html);
  
  if (supportsTrustedTypes() && trustedTypePolicy) {
    try {
      return trustedTypePolicy.createHTML(sanitized);
    } catch (error) {
      console.warn('Could not create trusted HTML:', error);
      return sanitized;
    }
  }
  
  return sanitized;
}

/**
 * Strip all HTML tags and return plain text
 */
export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  return html
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with regular space
    .replace(/&amp;/g, '&') // Decode common entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Check if string contains potentially dangerous HTML
 */
export function containsDangerousHtml(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return false;
  }

  // Check for script tags
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(html)) {
    return true;
  }

  // Check for event handlers
  if (/\s+on\w+\s*=/gi.test(html)) {
    return true;
  }

  // Check for javascript: URLs
  if (/javascript\s*:/gi.test(html)) {
    return true;
  }

  // Check for data: URLs with script content
  if (/data\s*:\s*text\s*\/\s*html/gi.test(html)) {
    return true;
  }

  return false;
}