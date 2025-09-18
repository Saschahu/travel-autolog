import { describe, it, expect } from 'vitest';
import { validateFileSize, validateRowCount } from '../uploadValidation';

// Create mock File objects for testing
function createMockFile(size: number, name = 'test.csv'): File {
  const file = new File([''], name);
  // Override the size property
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false
  });
  return file;
}

describe('uploadValidation', () => {
  describe('validateFileSize', () => {
    it('should pass for files under the default limit (5MB)', () => {
      const file = createMockFile(1024 * 1024); // 1MB
      const result = validateFileSize(file);
      
      expect(result.ok).toBe(true);
    });

    it('should pass for files exactly at the default limit', () => {
      const file = createMockFile(5 * 1024 * 1024); // Exactly 5MB
      const result = validateFileSize(file);
      
      expect(result.ok).toBe(true);
    });

    it('should fail for files over the default limit', () => {
      const file = createMockFile(5 * 1024 * 1024 + 1); // 5MB + 1 byte
      const result = validateFileSize(file);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('too_large');
        expect(result.limitMB).toBe(5);
      }
    });

    it('should respect custom maxBytes parameter', () => {
      const customLimit = 1024 * 1024; // 1MB
      const file = createMockFile(customLimit + 1); // 1MB + 1 byte
      const result = validateFileSize(file, customLimit);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('too_large');
        expect(result.limitMB).toBe(1);
      }
    });

    it('should handle zero-size files', () => {
      const file = createMockFile(0);
      const result = validateFileSize(file);
      
      expect(result.ok).toBe(true);
    });

    it('should handle very large custom limits', () => {
      const customLimit = 100 * 1024 * 1024; // 100MB
      const file = createMockFile(50 * 1024 * 1024); // 50MB
      const result = validateFileSize(file, customLimit);
      
      expect(result.ok).toBe(true);
    });
  });

  describe('validateRowCount', () => {
    it('should pass for row counts under the default limit (50000)', () => {
      const result = validateRowCount(1000);
      
      expect(result.ok).toBe(true);
    });

    it('should pass for row counts exactly at the default limit', () => {
      const result = validateRowCount(50000);
      
      expect(result.ok).toBe(true);
    });

    it('should fail for row counts over the default limit', () => {
      const result = validateRowCount(50001);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('too_many_rows');
        expect(result.limit).toBe(50000);
      }
    });

    it('should respect custom maxRows parameter', () => {
      const customLimit = 1000;
      const result = validateRowCount(1001, customLimit);
      
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe('too_many_rows');
        expect(result.limit).toBe(1000);
      }
    });

    it('should handle zero rows', () => {
      const result = validateRowCount(0);
      
      expect(result.ok).toBe(true);
    });

    it('should handle negative row counts (edge case)', () => {
      const result = validateRowCount(-1);
      
      expect(result.ok).toBe(true); // Negative counts are less than limit
    });

    it('should handle very large custom limits', () => {
      const customLimit = 1000000; // 1M rows
      const result = validateRowCount(500000, customLimit);
      
      expect(result.ok).toBe(true);
    });
  });
});