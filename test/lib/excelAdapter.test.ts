import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  coerceToSafeValue,
  sanitizePropertyName,
  createSafeObject,
  readMinimalSheet,
  writeMinimalSheet,
  MockExcelAdapter,
  mockExcelAdapter
} from '../../src/lib/excelAdapter';

describe('excelAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExcelAdapter.clearStorage();
  });

  describe('coerceToSafeValue', () => {
    it('should handle primitive types correctly', () => {
      expect(coerceToSafeValue('test')).toEqual({ value: 'test', type: 'string' });
      expect(coerceToSafeValue(123)).toEqual({ value: 123, type: 'number' });
      expect(coerceToSafeValue(true)).toEqual({ value: true, type: 'boolean' });
      expect(coerceToSafeValue(false)).toEqual({ value: false, type: 'boolean' });
    });

    it('should handle null and undefined', () => {
      expect(coerceToSafeValue(null)).toEqual({ value: null, type: 'null' });
      expect(coerceToSafeValue(undefined)).toEqual({ value: null, type: 'null' });
    });

    it('should handle dates', () => {
      const date = new Date('2023-01-01');
      expect(coerceToSafeValue(date)).toEqual({ value: date, type: 'date' });
    });

    it('should handle invalid dates', () => {
      const invalidDate = new Date('invalid');
      const result = coerceToSafeValue(invalidDate);
      expect(result.type).toBe('string');
      expect(result.value).toContain('Invalid Date');
    });

    it('should handle infinite numbers', () => {
      expect(coerceToSafeValue(Infinity).type).toBe('string');
      expect(coerceToSafeValue(-Infinity).type).toBe('string');
      expect(coerceToSafeValue(NaN).type).toBe('string');
    });

    it('should convert objects to strings', () => {
      const obj = { foo: 'bar' };
      const result = coerceToSafeValue(obj);
      expect(result.type).toBe('string');
      expect(result.value).toBe('[object Object]');
    });

    it('should convert arrays to strings', () => {
      const arr = [1, 2, 3];
      const result = coerceToSafeValue(arr);
      expect(result.type).toBe('string');
      expect(result.value).toBe('1,2,3');
    });
  });

  describe('sanitizePropertyName', () => {
    it('should sanitize dangerous property names', () => {
      expect(sanitizePropertyName('__proto__')).toBe('___proto__');
      expect(sanitizePropertyName('constructor')).toBe('_constructor');
      expect(sanitizePropertyName('prototype')).toBe('_prototype');
    });

    it('should handle case insensitive dangerous names', () => {
      expect(sanitizePropertyName('__PROTO__')).toBe('___PROTO__');
      expect(sanitizePropertyName('Constructor')).toBe('_Constructor');
    });

    it('should leave safe property names unchanged', () => {
      expect(sanitizePropertyName('name')).toBe('name');
      expect(sanitizePropertyName('value')).toBe('value');
      expect(sanitizePropertyName('id')).toBe('id');
    });
  });

  describe('createSafeObject', () => {
    it('should create object without prototype', () => {
      const obj = createSafeObject();
      expect(Object.getPrototypeOf(obj)).toBeNull();
      expect(obj.constructor).toBeUndefined();
      expect(obj.__proto__).toBeUndefined();
    });

    it('should prevent prototype pollution', () => {
      const obj = createSafeObject<any>();
      obj.__proto__ = { malicious: true };
      
      // The object itself should not be affected by prototype pollution
      expect(obj.malicious).toBeUndefined();
    });
  });

  describe('readMinimalSheet', () => {
    it('should read and sanitize sheet data', () => {
      const rawData = [
        ['Name', 'Age', 'Active'],
        ['John', 30, true],
        ['Jane', 25, false]
      ];

      const result = readMinimalSheet(rawData);
      
      expect(result.name).toBe('Sheet1');
      expect(result.rows).toHaveLength(3);
      expect(result.rows[0]).toEqual([
        { value: 'Name', type: 'string' },
        { value: 'Age', type: 'string' },
        { value: 'Active', type: 'string' }
      ]);
      expect(result.rows[1]).toEqual([
        { value: 'John', type: 'string' },
        { value: 30, type: 'number' },
        { value: true, type: 'boolean' }
      ]);
    });

    it('should handle empty or malformed data', () => {
      expect(readMinimalSheet([])).toEqual({ name: 'Sheet1', rows: [] });
      expect(readMinimalSheet(null as any)).toEqual({ name: 'Sheet1', rows: [] });
      expect(readMinimalSheet(undefined as any)).toEqual({ name: 'Sheet1', rows: [] });
    });

    it('should handle rows with different lengths', () => {
      const rawData = [
        ['A', 'B', 'C'],
        ['1', '2'],
        ['X', 'Y', 'Z', 'Extra']
      ];

      const result = readMinimalSheet(rawData);
      expect(result.rows[1]).toHaveLength(2);
      expect(result.rows[2]).toHaveLength(4);
    });
  });

  describe('writeMinimalSheet', () => {
    it('should extract raw values from cell data', () => {
      const sheetData = {
        name: 'TestSheet',
        rows: [
          [
            { value: 'Name', type: 'string' as const },
            { value: 'Age', type: 'string' as const }
          ],
          [
            { value: 'John', type: 'string' as const },
            { value: 30, type: 'number' as const }
          ]
        ]
      };

      const result = writeMinimalSheet(sheetData);
      expect(result).toEqual([
        ['Name', 'Age'],
        ['John', 30]
      ]);
    });

    it('should handle null values', () => {
      const sheetData = {
        name: 'TestSheet',
        rows: [[
          { value: null, type: 'null' as const }
        ]]
      };

      const result = writeMinimalSheet(sheetData);
      expect(result).toEqual([[null]]);
    });
  });

  describe('MockExcelAdapter', () => {
    it('should read empty workbook for non-existent path', async () => {
      const result = await mockExcelAdapter.readWorkbook('non-existent.xlsx');
      expect(result).toEqual({ worksheets: [] });
    });

    it('should write and read workbook data', async () => {
      const workbookData = {
        worksheets: [{
          name: 'Sheet1',
          rows: [[{ value: 'test', type: 'string' as const }]]
        }]
      };

      const writeResult = await mockExcelAdapter.writeWorkbook('test.xlsx', workbookData);
      expect(writeResult).toBe(true);

      const readResult = await mockExcelAdapter.readWorkbook('test.xlsx');
      expect(readResult).toEqual(workbookData);
    });

    it('should sanitize worksheet names during write', async () => {
      const workbookData = {
        worksheets: [{
          name: '__proto__',
          rows: []
        }]
      };

      await mockExcelAdapter.writeWorkbook('test.xlsx', workbookData);
      const result = await mockExcelAdapter.readWorkbook('test.xlsx');
      
      expect(result.worksheets[0].name).toBe('___proto__');
    });

    it('should handle invalid workbook data', async () => {
      const invalidData = null as any;
      const result = await mockExcelAdapter.writeWorkbook('test.xlsx', invalidData);
      expect(result).toBe(false);
    });

    it('should handle workbook data without worksheets array', async () => {
      const invalidData = { worksheets: 'not-an-array' } as any;
      const result = await mockExcelAdapter.writeWorkbook('test.xlsx', invalidData);
      expect(result).toBe(false);
    });

    it('should handle missing worksheet names', async () => {
      const workbookData = {
        worksheets: [{ name: undefined, rows: [] } as any]
      };

      await mockExcelAdapter.writeWorkbook('test.xlsx', workbookData);
      const result = await mockExcelAdapter.readWorkbook('test.xlsx');
      
      expect(result.worksheets[0].name).toBe('Sheet1');
    });

    it('should track stored workbooks', async () => {
      await mockExcelAdapter.writeWorkbook('book1.xlsx', { worksheets: [] });
      await mockExcelAdapter.writeWorkbook('book2.xlsx', { worksheets: [] });

      const stored = mockExcelAdapter.getStoredWorkbooks();
      expect(stored).toContain('book1.xlsx');
      expect(stored).toContain('book2.xlsx');
    });

    it('should clear storage', async () => {
      await mockExcelAdapter.writeWorkbook('test.xlsx', { worksheets: [] });
      expect(mockExcelAdapter.getStoredWorkbooks()).toHaveLength(1);

      mockExcelAdapter.clearStorage();
      expect(mockExcelAdapter.getStoredWorkbooks()).toHaveLength(0);
    });
  });
});