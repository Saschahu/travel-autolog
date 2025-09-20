import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  stripScriptTags,
  stripEventAttributes,
  sanitizeBasicHTML,
  allowBasicFormattingTags,
  initTrustedTypes,
  createTrustedHTML,
  getDOMPurify,
  sanitizeWithDOMPurify
} from '../../src/security/htmlSanitizer';

describe('htmlSanitizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('stripScriptTags', () => {
    it('should remove script tags and their content', () => {
      const maliciousHTML = '<div>Safe content</div><script>alert("xss")</script><p>More safe content</p>';
      const result = stripScriptTags(maliciousHTML);
      
      expect(result).toBe('<div>Safe content</div><p>More safe content</p>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should handle multiple script tags', () => {
      const html = '<script>alert(1)</script><div>content</div><script type="text/javascript">alert(2)</script>';
      const result = stripScriptTags(html);
      
      expect(result).toBe('<div>content</div>');
      expect(result).not.toContain('<script>');
    });

    it('should handle empty or no script tags', () => {
      expect(stripScriptTags('<div>No scripts here</div>')).toBe('<div>No scripts here</div>');
      expect(stripScriptTags('')).toBe('');
    });
  });

  describe('stripEventAttributes', () => {
    it('should remove on* event attributes', () => {
      const html = '<div onclick="alert(1)" onload="alert(2)" class="safe">Content</div>';
      const result = stripEventAttributes(html);
      
      expect(result).toContain('class="safe"');
      expect(result).toContain('Content');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onload');
    });

    it('should handle various event attribute formats', () => {
      const testCases = [
        '<div onclick="alert(1)">test</div>',
        '<div onClick="alert(1)">test</div>',
        '<div onmouseover=\'alert(1)\'>test</div>',
        '<div onkeydown=alert(1)>test</div>'
      ];

      testCases.forEach(html => {
        const result = stripEventAttributes(html);
        expect(result).not.toMatch(/on\w+\s*=/i);
        expect(result).toContain('test');
      });
    });
  });

  describe('sanitizeBasicHTML', () => {
    it('should sanitize malicious HTML comprehensively', () => {
      const maliciousHTML = `
        <div onclick="alert('xss')" onload="steal()">
          Safe content
          <script>document.cookie = 'stolen'</script>
          <a href="javascript:alert('xss')">Bad link</a>
        </div>
      `;

      const result = sanitizeBasicHTML(maliciousHTML);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onload');
      expect(result).not.toContain('javascript:');
      expect(result).toContain('Safe content');
    });

    it('should handle empty or null input', () => {
      expect(sanitizeBasicHTML('')).toBe('');
      expect(sanitizeBasicHTML(null as any)).toBe('');
      expect(sanitizeBasicHTML(undefined as any)).toBe('');
    });

    it('should preserve safe formatting', () => {
      const safeHTML = '<p><strong>Bold</strong> and <em>italic</em> text</p>';
      const result = sanitizeBasicHTML(safeHTML);
      
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
      expect(result).toContain('Bold');
      expect(result).toContain('italic');
    });
  });

  describe('allowBasicFormattingTags', () => {
    it('should allow basic formatting tags while sanitizing', () => {
      const html = '<p><strong>Bold</strong> <script>alert(1)</script></p>';
      const result = allowBasicFormattingTags(html);
      
      expect(result).toContain('<strong>');
      expect(result).not.toContain('<script>');
    });
  });

  describe('Trusted Types support', () => {
    beforeEach(() => {
      // Reset trusted types
      delete (window as any).trustedTypes;
    });

    it('should initialize trusted types when available', () => {
      const mockPolicy = {
        createHTML: vi.fn((input: string) => `TRUSTED:${input}`)
      };

      const mockTrustedTypes = {
        createPolicy: vi.fn(() => mockPolicy)
      };

      Object.defineProperty(window, 'trustedTypes', {
        value: mockTrustedTypes,
        configurable: true
      });

      const result = initTrustedTypes();
      expect(result).toBe(true);
      expect(mockTrustedTypes.createPolicy).toHaveBeenCalledWith('html-sanitizer', expect.any(Object));
    });

    it('should handle missing trusted types gracefully', () => {
      delete (window as any).trustedTypes;
      
      const result = initTrustedTypes();
      expect(result).toBe(false);
    });

    it('should create trusted HTML with policy', () => {
      const mockPolicy = {
        createHTML: vi.fn((input: string) => `TRUSTED:${input}`)
      };

      const mockTrustedTypes = {
        createPolicy: vi.fn(() => mockPolicy)
      };

      Object.defineProperty(window, 'trustedTypes', {
        value: mockTrustedTypes,
        configurable: true
      });

      initTrustedTypes();
      const result = createTrustedHTML('<p>test</p>');
      
      expect(result).toBe('TRUSTED:<p>test</p>');
    });

    it('should fallback to basic sanitization without trusted types', () => {
      // Make sure no trusted types policy is set
      delete (window as any).trustedTypes;
      
      const html = '<p>test</p><script>alert(1)</script>';
      const result = createTrustedHTML(html);
      
      expect(result).toContain('<p>test</p>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });
  });

  describe('DOMPurify dynamic import', () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it('should dynamically import DOMPurify', async () => {
      const mockDOMPurify = {
        default: {
          sanitize: vi.fn((html: string) => `PURIFIED:${html}`)
        }
      };

      vi.doMock('dompurify', () => mockDOMPurify);

      const DOMPurify = await getDOMPurify();
      expect(DOMPurify).toBe(mockDOMPurify);
    });

    it('should handle DOMPurify import failure', async () => {
      vi.doMock('dompurify', () => {
        throw new Error('Module not found');
      });

      const DOMPurify = await getDOMPurify();
      expect(DOMPurify).toBeNull();
    });

    it('should sanitize with DOMPurify when available', async () => {
      const mockDOMPurify = {
        default: {
          sanitize: vi.fn((html: string) => `PURIFIED:${html}`)
        }
      };

      vi.doMock('dompurify', () => mockDOMPurify);

      const result = await sanitizeWithDOMPurify('<p>test</p>');
      expect(result).toBe('PURIFIED:<p>test</p>');
    });

    it('should fallback to basic sanitization when DOMPurify unavailable', async () => {
      vi.doMock('dompurify', () => {
        throw new Error('Module not found');
      });

      const html = '<p>test</p><script>alert(1)</script>';
      const result = await sanitizeWithDOMPurify(html);
      
      expect(result).toContain('<p>test</p>');
      expect(result).not.toContain('<script>');
    });
  });
});