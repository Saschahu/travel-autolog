import { describe, it, expect } from 'vitest';
import { sanitizeCell, sanitizeRecord } from '../csvSanitizer';

describe('csvSanitizer', () => {
  describe('sanitizeCell', () => {
    it('should escape cells starting with =', () => {
      expect(sanitizeCell('=A1')).toBe("'=A1");
      expect(sanitizeCell('=SUM(1,2)')).toBe("'=SUM(1,2)");
      expect(sanitizeCell('=1+1')).toBe("'=1+1");
    });

    it('should escape cells starting with +', () => {
      expect(sanitizeCell('+SUM(1,2)')).toBe("'+SUM(1,2)");
      expect(sanitizeCell('+1+2')).toBe("'+1+2");
    });

    it('should escape cells starting with -', () => {
      expect(sanitizeCell('-CMD')).toBe("'-CMD");
      expect(sanitizeCell('-1+2')).toBe("'-1+2");
    });

    it('should escape cells starting with @', () => {
      expect(sanitizeCell('@HYPERLINK("http://evil.com","Click me")')).toBe("'@HYPERLINK(\"http://evil.com\",\"Click me\")");
      expect(sanitizeCell('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
    });

    it('should not modify normal text', () => {
      expect(sanitizeCell('Normal text')).toBe('Normal text');
      expect(sanitizeCell('Hello World')).toBe('Hello World');
      expect(sanitizeCell('test123')).toBe('test123');
    });

    it('should handle positive numbers', () => {
      expect(sanitizeCell(123)).toBe('123');
      expect(sanitizeCell(0)).toBe('0');
    });

    it('should escape negative numbers (start with -)', () => {
      expect(sanitizeCell(-123)).toBe("'-123"); // This should be escaped because it starts with -
    });

    it('should handle null and undefined', () => {
      expect(sanitizeCell(null)).toBe('');
      expect(sanitizeCell(undefined)).toBe('');
    });

    it('should handle empty strings', () => {
      expect(sanitizeCell('')).toBe('');
      expect(sanitizeCell('   ')).toBe('   '); // Whitespace preserved
    });

    it('should handle boolean values', () => {
      expect(sanitizeCell(true)).toBe('true');
      expect(sanitizeCell(false)).toBe('false');
    });

    it('should handle dangerous prefixes in the middle of strings', () => {
      expect(sanitizeCell('Hello=World')).toBe('Hello=World'); // Should not be escaped
      expect(sanitizeCell('test+value')).toBe('test+value'); // Should not be escaped
    });
  });

  describe('sanitizeRecord', () => {
    it('should sanitize all values in a record', () => {
      const input = {
        name: 'John Doe',
        formula: '=SUM(A1:A10)',
        command: '+CMD',
        hyperlink: '@HYPERLINK("http://evil.com")',
        normal: 'Normal value',
        positive: 123,
        negative: -456
      };

      const result = sanitizeRecord(input);

      expect(result).toEqual({
        name: 'John Doe',
        formula: "'=SUM(A1:A10)",
        command: "'+CMD",
        hyperlink: "'@HYPERLINK(\"http://evil.com\")",
        normal: 'Normal value',
        positive: '123',
        negative: "'-456"  // Negative numbers get escaped
      });
    });

    it('should handle empty record', () => {
      expect(sanitizeRecord({})).toEqual({});
    });

    it('should handle record with null/undefined values', () => {
      const input = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        dangerous: '=A1'
      };

      const result = sanitizeRecord(input);

      expect(result).toEqual({
        nullValue: '',
        undefinedValue: '',
        emptyString: '',
        dangerous: "'=A1"
      });
    });
  });
});