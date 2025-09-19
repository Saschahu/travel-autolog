/**
 * HTML Sanitization and Trusted Types Implementation
 * 
 * Provides safe HTML rendering with DOMPurify sanitization and
 * Trusted Types API integration for CSP compliance.
 */

// Minimal allowlist for fallback sanitizer
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'span', 'div'];
const ALLOWED_ATTRIBUTES = ['class', 'style'];

/**
 * Minimal synchronous HTML sanitizer (fallback)
 * Used when DOMPurify is not available or for simple cases
 */
export function sanitizeHtmlSync(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Basic HTML sanitization - removes scripts, event handlers, dangerous attributes
  return input
    .replace(/<script[^>]*>.*?<\/script>/gsi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gsi, '')
    .replace(/<object[^>]*>.*?<\/object>/gsi, '')
    .replace(/<embed[^>]*>/gsi, '')
    .replace(/on\w+="[^"]*"/gsi, '')
    .replace(/javascript:/gsi, '')
    .replace(/<[^>]+>/g, (match) => {
      // Allow only basic formatting tags
      const tagMatch = match.match(/<\/?(\w+)/);
      if (!tagMatch || !ALLOWED_TAGS.includes(tagMatch[1].toLowerCase())) {
        return '';
      }
      return match;
    });
}

/**
 * Asynchronous HTML sanitizer using DOMPurify
 * Dynamically imports DOMPurify to avoid bloating initial bundle
 */
export async function sanitizeHtml(input: string): Promise<string> {
  if (!input || typeof input !== 'string') {
    return '';
  }

  try {
    // Dynamic import to keep DOMPurify out of initial bundle
    const { default: DOMPurify } = await import('dompurify');
    
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['class', 'style'],
      ALLOW_DATA_ATTR: false,
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });
  } catch (error) {
    console.warn('DOMPurify not available, falling back to basic sanitization:', error);
    return sanitizeHtmlSync(input);
  }
}

// Trusted Types policy instance
let trustedTypesPolicy: TrustedTypePolicy | null = null;
let policyCreationAttempted = false;

/**
 * Get or create Trusted Types policy
 */
function getTrustedTypesPolicy(): TrustedTypePolicy | null {
  if (policyCreationAttempted) {
    return trustedTypesPolicy;
  }
  
  policyCreationAttempted = true;
  
  if (typeof window !== 'undefined' && window.trustedTypes) {
    try {
      trustedTypesPolicy = window.trustedTypes.createPolicy('app#default', {
        createHTML: (input: string) => {
          // Policy only accepts pre-sanitized input
          // This ensures all HTML going through Trusted Types is safe
          return input;
        }
      });
    } catch (error) {
      console.warn('Failed to create Trusted Types policy:', error);
    }
  }
  
  return trustedTypesPolicy;
}

/**
 * Convert HTML string to safe TrustedHTML or sanitized string
 * This is the main function to use for safe HTML rendering
 */
export async function toSafeHtml(input: string): Promise<TrustedHTML | string> {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // First, sanitize the input
  const sanitized = await sanitizeHtml(input);
  
  // Then, if Trusted Types is available, create TrustedHTML
  const policy = getTrustedTypesPolicy();
  if (policy) {
    try {
      return policy.createHTML(sanitized);
    } catch (error) {
      console.warn('Failed to create TrustedHTML:', error);
    }
  }
  
  // Fallback: return sanitized string
  return sanitized;
}

/**
 * Synchronous version for cases where async is not possible
 */
export function toSafeHtmlSync(input: string): TrustedHTML | string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const sanitized = sanitizeHtmlSync(input);
  
  const policy = getTrustedTypesPolicy();
  if (policy) {
    try {
      return policy.createHTML(sanitized);
    } catch (error) {
      console.warn('Failed to create TrustedHTML:', error);
    }
  }
  
  return sanitized;
}
