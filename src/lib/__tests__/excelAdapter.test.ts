import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as XLSX from 'xlsx';
import {
  readExcelFile,
  writeExcelFile,
  createWorksheetFromData,
  type WorksheetData,
  type ExcelReadResult,
} from '../excelAdapter';

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

// Mock XLSX
vi.mock('xlsx', () => {
  const mockWorkbook = {
    SheetNames: ['Sheet1', 'Sheet2'],
    Sheets: {
      Sheet1: { A1: { v: 'Header1' }, A2: { v: 'Data1' } },
      Sheet2: { A1: { v: 'Header2' }, A2: { v: 'Data2' } },
    },
  };

  return {
    read: vi.fn(() => mockWorkbook),
    write: vi.fn(() => new Uint8Array([1, 2, 3, 4])),
    utils: {
      sheet_to_json: vi.fn(() => [['Header'], ['Data']]),
      book_new: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
      book_append_sheet: vi.fn(),
      aoa_to_sheet: vi.fn(() => ({})),
    },
  };
});

describe('Excel Adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readExcelFile', () => {
    it('should read simple workbook from ArrayBuffer', async () => {
      const buffer = new ArrayBuffer(100);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        ['Name', 'Age'],
        ['John', 30],
        ['Jane', 25],
      ]);

      const result: ExcelReadResult = await readExcelFile(buffer);

      expect(result.success).toBe(true);
      expect(result.worksheets).toHaveLength(2);
      expect(result.worksheets[0].name).toBe('Sheet1');
      expect(result.worksheets[0].data).toEqual([
        ['Name', 'Age'],
        ['John', 30],
        ['Jane', 25],
      ]);
    });

    it('should handle empty buffer', async () => {
      const buffer = new ArrayBuffer(0);

      const result = await readExcelFile(buffer);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Empty or invalid buffer');
      expect(result.worksheets).toEqual([]);
    });

    it('should handle null buffer', async () => {
      const result = await readExcelFile(null as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Empty or invalid buffer');
    });

    it('should handle XLSX.read errors', async () => {
      const buffer = new ArrayBuffer(100);
      vi.mocked(XLSX.read).mockImplementationOnce(() => {
        throw new Error('Invalid Excel file');
      });

      const result = await readExcelFile(buffer);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid Excel file');
    });

    it('should coerce non-primitive values safely', async () => {
      const buffer = new ArrayBuffer(100);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([
        ['Mixed', null, undefined, new Date('2023-01-01'), { obj: 'value' }],
      ]);

      const result = await readExcelFile(buffer);

      expect(result.success).toBe(true);
      expect(result.worksheets[0].data[0]).toEqual([
        'Mixed',
        null,
        null,
        '2023-01-01T00:00:00.000Z',
        '{"obj":"value"}',
      ]);
    });

    it('should prevent prototype pollution in sheet names', async () => {
      const maliciousWorkbook = {
        SheetNames: ['__proto__', 'constructor', 'prototype', 'normal'],
        Sheets: {
          __proto__: {},
          constructor: {},
          prototype: {},
          normal: {},
        },
      };
      vi.mocked(XLSX.read).mockReturnValue(maliciousWorkbook);
      vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([['safe']]);

      const result = await readExcelFile(new ArrayBuffer(100));

      expect(result.success).toBe(true);
      const sheetNames = result.worksheets.map(w => w.name);
      expect(sheetNames).toEqual(['___proto__', '_constructor', '_prototype', 'normal']);
    });

    it('should handle sheet processing errors gracefully', async () => {
      const buffer = new ArrayBuffer(100);
      vi.mocked(XLSX.utils.sheet_to_json)
        .mockReturnValueOnce([['Good sheet']])
        .mockImplementationOnce(() => {
          throw new Error('Bad sheet');
        });

      const result = await readExcelFile(buffer);

      expect(result.success).toBe(true);
      expect(result.worksheets).toHaveLength(1); // Only good sheet processed
      expect(result.worksheets[0].data).toEqual([['Good sheet']]);
    });
  });

  describe('writeExcelFile', () => {
    it('should write workbook to Blob', async () => {
      const worksheets: WorksheetData[] = [
        {
          name: 'TestSheet',
          data: [['Header1', 'Header2'], ['Value1', 'Value2']],
        },
      ];

      const blob = await writeExcelFile(worksheets);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
        ['Header1', 'Header2'],
        ['Value1', 'Value2'],
      ]);
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    });

    it('should handle empty worksheets array', async () => {
      await expect(writeExcelFile([])).rejects.toThrow('No worksheets provided');
    });

    it('should handle null worksheets', async () => {
      await expect(writeExcelFile(null as any)).rejects.toThrow('No worksheets provided');
    });

    it('should sanitize worksheet names', async () => {
      const worksheets: WorksheetData[] = [
        {
          name: '__proto__',
          data: [['safe']],
        },
        {
          name: 'Very long worksheet name that exceeds Excel limit of 31 characters',
          data: [['safe']],
        },
      ];

      await writeExcelFile(worksheets);

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        '___proto__'
      );
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'Very long worksheet name that '
      );
    });

    it('should skip invalid worksheet data', async () => {
      const worksheets: WorksheetData[] = [
        {
          name: 'Valid',
          data: [['Header'], ['Data']],
        },
        {
          name: 'Invalid',
          data: 'not an array' as any,
        },
      ];

      const blob = await writeExcelFile(worksheets);

      expect(blob).toBeInstanceOf(Blob);
      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledTimes(1);
    });

    it('should coerce non-primitive values in data', async () => {
      const worksheets: WorksheetData[] = [
        {
          name: 'Mixed',
          data: [
            ['Header'],
            [{ obj: 'value' }],
            [null],
            [undefined],
            [new Date('2023-01-01')],
          ],
        },
      ];

      await writeExcelFile(worksheets);

      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
        ['Header'],
        ['{"obj":"value"}'],
        [null],
        [null],
        ['2023-01-01T00:00:00.000Z'],
      ]);
    });

    it('should handle XLSX.write errors', async () => {
      const worksheets: WorksheetData[] = [
        { name: 'Test', data: [['Header']] },
      ];

      vi.mocked(XLSX.write).mockImplementation(() => {
        throw new Error('Write error');
      });

      await expect(writeExcelFile(worksheets)).rejects.toThrow('Write error');
    });
  });

  describe('createWorksheetFromData', () => {
    it('should create worksheet from key-value data', () => {
      const data = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Boston' },
      ];

      const result = createWorksheetFromData(data);

      expect(result).toHaveLength(3); // Header + 2 data rows
      expect(result[0]).toEqual(expect.arrayContaining(['name', 'age', 'city']));
      expect(result[1]).toEqual(expect.arrayContaining(['John', 30, 'New York']));
      expect(result[2]).toEqual(expect.arrayContaining(['Jane', 25, 'Boston']));
    });

    it('should handle empty array', () => {
      const result = createWorksheetFromData([]);

      expect(result).toEqual([]);
    });

    it('should handle null/undefined input', () => {
      expect(createWorksheetFromData(null as any)).toEqual([]);
      expect(createWorksheetFromData(undefined as any)).toEqual([]);
    });

    it('should skip non-object items', () => {
      const data = [
        { name: 'John', age: 30 },
        'invalid item',
        null,
        { name: 'Jane', age: 25 },
      ];

      const result = createWorksheetFromData(data);

      expect(result).toHaveLength(3); // Header + 2 valid data rows
      expect(result[1]).toEqual(expect.arrayContaining(['John', 30]));
      expect(result[2]).toEqual(expect.arrayContaining(['Jane', 25]));
    });

    it('should sanitize object keys to prevent prototype pollution', () => {
      const data = [
        { __proto__: 'value1', constructor: 'value2', normal: 'value3' },
      ];

      const result = createWorksheetFromData(data);

      expect(result[0]).toEqual(expect.arrayContaining(['___proto__', '_constructor', 'normal']));
    });

    it('should handle missing properties in objects', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane' }, // Missing age
        { age: 25 }, // Missing name
      ];

      const result = createWorksheetFromData(data);

      expect(result).toHaveLength(4); // Header + 3 data rows
      expect(result[0]).toEqual(expect.arrayContaining(['name', 'age']));
      expect(result[2]).toEqual(expect.arrayContaining(['Jane', null])); // null for missing age
      expect(result[3]).toEqual(expect.arrayContaining([null, 25])); // null for missing name
    });

    it('should coerce complex values', () => {
      const data = [
        {
          string: 'text',
          number: 42,
          boolean: true,
          date: new Date('2023-01-01'),
          object: { nested: 'value' },
          array: [1, 2, 3],
          null: null,
          undefined: undefined,
        },
      ];

      const result = createWorksheetFromData(data);

      const dataRow = result[1];
      expect(dataRow).toContain('text');
      expect(dataRow).toContain(42);
      expect(dataRow).toContain(true);
      expect(dataRow).toContain('2023-01-01T00:00:00.000Z');
      expect(dataRow).toContain('{"nested":"value"}');
      expect(dataRow).toContain('[1,2,3]');
      expect(dataRow).toContain(null);
      expect(dataRow).toContain(null); // undefined becomes null
    });

    it('should handle circular references in objects', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      const data = [circular];

      const result = createWorksheetFromData(data);

      expect(result).toHaveLength(2); // Header + 1 data row
      // Should handle the circular reference gracefully (JSON.stringify will fail)
      const dataRow = result[1];
      expect(dataRow).toContain('test');
      expect(dataRow).toContain('[Object]'); // Fallback for circular reference
    });
  });

  describe('defensive parsing', () => {
    it('should not leak prototype properties', () => {
      const maliciousData = Object.create({ malicious: 'value' });
      maliciousData.safe = 'data';

      const result = createWorksheetFromData([maliciousData]);

      // Should only include own properties, not inherited ones
      expect(result[0]).not.toContain('malicious');
      expect(result[0]).toContain('safe');
    });

    it('should handle very large datasets without memory issues', () => {
      // Create a reasonably large dataset to test memory handling
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        value: Math.random(),
      }));

      const result = createWorksheetFromData(largeData);

      expect(result).toHaveLength(1001); // Header + 1000 data rows
      expect(result[0]).toEqual(['id', 'name', 'value']);
      expect(result[1]).toEqual([0, 'Item 0', expect.any(Number)]);
      expect(result[1000]).toEqual([999, 'Item 999', expect.any(Number)]);
    });
  });
});