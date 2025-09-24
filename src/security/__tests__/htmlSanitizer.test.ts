import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  supportsTrustedTypes,
  sanitizeHtml,
  toSafeHtml,
  stripHtmlTags,
  containsDangerousHtml,
  SAFE_HTML_CONFIG
} from '../htmlSanitizer';

// Mock DOMPurify dynamic import
const mockDOMPurify = {
  sanitize: vi.fn(),
};

vi.mock('dompurify', () => ({
  default: mockDOMPurify,
}));

// Mock Trusted Types
const mockTrustedTypes = {
  createPolicy: vi.fn(),
};

const mockPolicy = {
  createHTML: vi.fn(),
};

describe('HTML Sanitizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDOMPurify.sanitize.mockImplementation((html) => html);
    mockTrustedTypes.createPolicy.mockReturnValue(mockPolicy);
    mockPolicy.createHTML.mockImplementation((html) => html as TrustedHTML);
  });

  describe('supportsTrustedTypes', () => {
    it('should return true when Trusted Types are supported', () => {
      Object.defineProperty(window, 'trustedTypes', {
        value: mockTrustedTypes,
        writable: true,
      });

      expect(supportsTrustedTypes()).toBe(true);
    });

    it('should return false when Trusted Types are not supported', () => {
      const originalTrustedTypes = (window as any).trustedTypes;
      Object.defineProperty(window, 'trustedTypes', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      expect(supportsTrustedTypes()).toBe(false);

      // Restore
      Object.defineProperty(window, 'trustedTypes', {
        value: originalTrustedTypes,
        writable: true,
        configurable: true,
      });
    });

    it('should return false in non-browser environment', () => {
      const originalWindow = global.window;
      // @ts-expect-error Testing non-browser environment
      delete global.window;

      expect(supportsTrustedTypes()).toBe(false);

      global.window = originalWindow;
    });
  });

  describe('sanitizeHtml', () => {
    it('should sanitize HTML using DOMPurify with safe config', async () => {
      const input = '<p>Safe content</p><script>alert("xss")</script>';
      const sanitized = '<p>Safe content</p>';
      mockDOMPurify.sanitize.mockReturnValue(sanitized);

      const result = await sanitizeHtml(input);

      expect(mockDOMPurify.sanitize).toHaveBeenCalledWith(input, {
        ALLOWED_TAGS: SAFE_HTML_CONFIG.ALLOWED_TAGS,
        ALLOWED_ATTR: SAFE_HTML_CONFIG.ALLOWED_ATTR,
        FORBID_TAGS: SAFE_HTML_CONFIG.FORBID_TAGS,
        FORBID_ATTR: SAFE_HTML_CONFIG.FORBID_ATTR,
        USE_PROFILES: { html: true },
      });
      expect(result).toBe(sanitized);
    });

    it('should strip script tags', async () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      mockDOMPurify.sanitize.mockReturnValue('<p>Hello</p>');

      const result = await sanitizeHtml(input);

      expect(result).toBe('<p>Hello</p>');
    });

    it('should strip event handlers', async () => {
      const input = '<div onclick="alert(\'xss\')">Click me</div>';
      mockDOMPurify.sanitize.mockReturnValue('<div>Click me</div>');

      const result = await sanitizeHtml(input);

      expect(result).toBe('<div>Click me</div>');
    });

    it('should allow basic formatting tags', async () => {
      const input = '<p><strong>Bold</strong> and <em>italic</em> text</p>';
      mockDOMPurify.sanitize.mockReturnValue(input);

      const result = await sanitizeHtml(input);

      expect(result).toBe(input);
    });

    it('should return empty string for null/undefined input', async () => {
      expect(await sanitizeHtml('')).toBe('');
      expect(await sanitizeHtml(null as any)).toBe('');
      expect(await sanitizeHtml(undefined as any)).toBe('');
    });

    it('should return empty string for non-string input', async () => {
      expect(await sanitizeHtml(123 as any)).toBe('');
      expect(await sanitizeHtml({} as any)).toBe('');
      expect(await sanitizeHtml([] as any)).toBe('');
    });

    it('should fallback to tag stripping on DOMPurify error', async () => {
      const input = '<p>Content</p><script>alert("xss")</script>';
      mockDOMPurify.sanitize.mockImplementation(() => {
        throw new Error('DOMPurify error');
      });

      const result = await sanitizeHtml(input);

      expect(result).toBe('Contentalert("xss")');
    });
  });

  describe('toSafeHtml', () => {
    it('should create TrustedHTML when Trusted Types are supported', async () => {
      Object.defineProperty(window, 'trustedTypes', {
        value: mockTrustedTypes,
        writable: true,
      });

      const input = '<p>Safe content</p>';
      const sanitized = '<p>Safe content</p>';
      const trustedHtml = 'trusted-html' as TrustedHTML;

      mockDOMPurify.sanitize.mockReturnValue(sanitized);
      mockPolicy.createHTML.mockReturnValue(trustedHtml);

      // Need to re-import to trigger policy creation
      vi.resetModules();
      const { toSafeHtml: freshToSafeHtml } = await import('../htmlSanitizer');

      const result = await freshToSafeHtml(input);

      expect(result).toBe(trustedHtml);
    });

    it('should return sanitized string when Trusted Types are not supported', async () => {
      Object.defineProperty(window, 'trustedTypes', {
        value: undefined,
        writable: true,
      });

      const input = '<p>Safe content</p>';
      const sanitized = '<p>Safe content</p>';
      mockDOMPurify.sanitize.mockReturnValue(sanitized);

      const result = await toSafeHtml(input);

      expect(result).toBe(sanitized);
    });

    it('should fallback to sanitized string on policy error', async () => {
      Object.defineProperty(window, 'trustedTypes', {
        value: mockTrustedTypes,
        writable: true,
      });

      const input = '<p>Safe content</p>';
      const sanitized = '<p>Safe content</p>';
      mockDOMPurify.sanitize.mockReturnValue(sanitized);
      mockPolicy.createHTML.mockImplementation(() => {
        throw new Error('Policy error');
      });

      // Need to re-import to trigger policy creation
      vi.resetModules();
      const { toSafeHtml: freshToSafeHtml } = await import('../htmlSanitizer');

      const result = await freshToSafeHtml(input);

      expect(result).toBe(sanitized);
    });
  });

  describe('stripHtmlTags', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const result = stripHtmlTags(input);

      expect(result).toBe('Hello world!');
    });

    it('should decode common HTML entities', () => {
      const input = 'Hello&nbsp;world&amp;test&lt;tag&gt;&quot;quote&quot;&#39;apostrophe&#39;';
      const result = stripHtmlTags(input);

      expect(result).toBe('Hello world&test<tag>"quote"\'apostrophe\'');
    });

    it('should return empty string for null/undefined input', () => {
      expect(stripHtmlTags('')).toBe('');
      expect(stripHtmlTags(null as any)).toBe('');
      expect(stripHtmlTags(undefined as any)).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(stripHtmlTags(123 as any)).toBe('');
      expect(stripHtmlTags({} as any)).toBe('');
    });

    it('should trim whitespace', () => {
      const input = '  <p>  Hello  </p>  ';
      const result = stripHtmlTags(input);

      expect(result).toBe('Hello');
    });
  });

  describe('containsDangerousHtml', () => {
    it('should detect script tags', () => {
      expect(containsDangerousHtml('<script>alert("xss")</script>')).toBe(true);
      expect(containsDangerousHtml('<SCRIPT>alert("xss")</SCRIPT>')).toBe(true);
      expect(containsDangerousHtml('<script src="evil.js"></script>')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsDangerousHtml('<div onclick="alert(\'xss\')">Click</div>')).toBe(true);
      expect(containsDangerousHtml('<img onload="alert(\'xss\')" />')).toBe(true);
      expect(containsDangerousHtml('<input onfocus="steal()" />')).toBe(true);
    });

    it('should detect javascript: URLs', () => {
      expect(containsDangerousHtml('<a href="javascript:alert(\'xss\')">Link</a>')).toBe(true);
      expect(containsDangerousHtml('<img src="javascript:alert(\'xss\')" />')).toBe(true);
    });

    it('should detect dangerous data: URLs', () => {
      expect(containsDangerousHtml('<iframe src="data:text/html,<script>alert(\'xss\')</script>"></iframe>')).toBe(true);
    });

    it('should return false for safe HTML', () => {
      expect(containsDangerousHtml('<p>Safe content</p>')).toBe(false);
      expect(containsDangerousHtml('<strong>Bold text</strong>')).toBe(false);
      expect(containsDangerousHtml('<a href="https://example.com">Link</a>')).toBe(false);
    });

    it('should return false for null/undefined input', () => {
      expect(containsDangerousHtml('')).toBe(false);
      expect(containsDangerousHtml(null as any)).toBe(false);
      expect(containsDangerousHtml(undefined as any)).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(containsDangerousHtml(123 as any)).toBe(false);
      expect(containsDangerousHtml({} as any)).toBe(false);
    });
  });

  describe('SAFE_HTML_CONFIG', () => {
    it('should define allowed tags for basic formatting', () => {
      expect(SAFE_HTML_CONFIG.ALLOWED_TAGS).toContain('p');
      expect(SAFE_HTML_CONFIG.ALLOWED_TAGS).toContain('strong');
      expect(SAFE_HTML_CONFIG.ALLOWED_TAGS).toContain('em');
      expect(SAFE_HTML_CONFIG.ALLOWED_TAGS).toContain('br');
    });

    it('should forbid dangerous tags', () => {
      expect(SAFE_HTML_CONFIG.FORBID_TAGS).toContain('script');
      expect(SAFE_HTML_CONFIG.FORBID_TAGS).toContain('object');
      expect(SAFE_HTML_CONFIG.FORBID_TAGS).toContain('embed');
    });

    it('should forbid event handler attributes', () => {
      expect(SAFE_HTML_CONFIG.FORBID_ATTR).toContain('onclick');
      expect(SAFE_HTML_CONFIG.FORBID_ATTR).toContain('onload');
      expect(SAFE_HTML_CONFIG.FORBID_ATTR).toContain('onerror');
    });

    it('should allow safe attributes', () => {
      expect(SAFE_HTML_CONFIG.ALLOWED_ATTR).toContain('class');
      expect(SAFE_HTML_CONFIG.ALLOWED_ATTR).toContain('id');
    });
  });

  describe('DOMPurify dynamic import', () => {
    it('should defer DOMPurify import until needed', async () => {
      // Clear the import cache
      vi.resetModules();

      const input = '<p>Test</p>';
      
      // Import sanitizer and call function
      const { sanitizeHtml: freshSanitizeHtml } = await import('../htmlSanitizer');
      await freshSanitizeHtml(input);

      // Verify that DOMPurify was imported and used
      expect(mockDOMPurify.sanitize).toHaveBeenCalled();
    });
  });
});