// HTML sanitizer with script stripping and trusted types support

const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'b', 'i', 'span', 'div'];
const FORBIDDEN_ATTRS = /^on\w+/i; // Event handlers like onclick, onload, etc.

export function stripScriptTags(html: string): string {
  // Remove script tags and their content
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

export function stripEventAttributes(html: string): string {
  // Remove all on* event attributes - handle various formats
  return html.replace(/\s+on\w+\s*=\s*(?:["\'][^"\']*["\']?|[^\s>]+)/gi, '');
}

export function sanitizeBasicHTML(html: string): string {
  if (!html) return '';
  
  let sanitized = html;
  
  // Strip script tags first
  sanitized = stripScriptTags(sanitized);
  
  // Strip event attributes
  sanitized = stripEventAttributes(sanitized);
  
  // Remove dangerous attributes like href="javascript:"
  sanitized = sanitized.replace(/href\s*=\s*["\']javascript:[^"\']*["\']?/gi, '');
  
  return sanitized;
}

export function allowBasicFormattingTags(html: string): string {
  const sanitized = sanitizeBasicHTML(html);
  
  // For now, just return sanitized - in a real implementation,
  // we would parse and filter to only allowed tags
  return sanitized;
}

// Trusted Types support
interface TrustedTypePolicy {
  createHTML(input: string): string;
}

interface TrustedTypePolicyFactory {
  createPolicy(name: string, rules: any): TrustedTypePolicy;
}

declare global {
  interface Window {
    trustedTypes?: TrustedTypePolicyFactory;
  }
}

let trustedTypePolicy: TrustedTypePolicy | null = null;

export function initTrustedTypes(): boolean {
  if (!window.trustedTypes) return false;
  
  try {
    trustedTypePolicy = window.trustedTypes.createPolicy('html-sanitizer', {
      createHTML: (input: string) => sanitizeBasicHTML(input)
    });
    return true;
  } catch {
    return false;
  }
}

export function createTrustedHTML(html: string): string {
  if (trustedTypePolicy) {
    return trustedTypePolicy.createHTML(html);
  }
  return sanitizeBasicHTML(html);
}

// Dynamic import for DOMPurify (mocked in tests)
let domPurifyPromise: Promise<any> | null = null;

export async function getDOMPurify(): Promise<any> {
  if (!domPurifyPromise) {
    domPurifyPromise = import('dompurify').catch(() => null);
  }
  return domPurifyPromise;
}

export async function sanitizeWithDOMPurify(html: string): Promise<string> {
  const DOMPurify = await getDOMPurify();
  if (DOMPurify?.default?.sanitize) {
    return DOMPurify.default.sanitize(html);
  }
  return sanitizeBasicHTML(html);
}