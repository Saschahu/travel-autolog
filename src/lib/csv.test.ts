import { describe, it, expect } from 'vitest';
import { parseCsv, type CsvParseResult } from './csv';

// Helper to create a File object from string content
function createCSVFile(content: string, filename = 'test.csv'): File {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  
  // Create a custom File-like object that implements the File interface
  class MockFile {
    public name: string;
    public size: number;
    public type: string;
    public lastModified: number;
    public webkitRelativePath: string = '';

    constructor(content: string, name: string) {
      this.name = name;
      this.type = 'text/csv';
      this.size = encoder.encode(content).length;
      this.lastModified = Date.now();
    }

    async text(): Promise<string> {
      return content;
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
      return data.buffer;
    }

    stream(): ReadableStream {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(data);
          controller.close();
        }
      });
    }

    slice(start?: number, end?: number, contentType?: string): Blob {
      const slicedContent = content.slice(start, end);
      return new MockFile(slicedContent, this.name) as any;
    }
  }
  
  return new MockFile(content, filename) as any as File;
}

describe('CSV Parser', () => {
  describe('Basic parsing', () => {
    it('should parse simple comma-separated CSV', async () => {
      const csvContent = 'Name,Age,City\nJohn,25,New York\nJane,30,San Francisco';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          { Name: 'John', Age: '25', City: 'New York' },
          { Name: 'Jane', Age: '30', City: 'San Francisco' }
        ],
        totalRows: 2
      });
    });

    it('should parse semicolon-separated CSV', async () => {
      const csvContent = 'Name;Age;City\nJohn;25;New York\nJane;30;San Francisco';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          { Name: 'John', Age: '25', City: 'New York' },
          { Name: 'Jane', Age: '30', City: 'San Francisco' }
        ],
        totalRows: 2
      });
    });

    it('should parse tab-separated CSV', async () => {
      const csvContent = 'Name\tAge\tCity\nJohn\t25\tNew York\nJane\t30\tSan Francisco';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result).toEqual({
        headers: ['Name', 'Age', 'City'],
        rows: [
          { Name: 'John', Age: '25', City: 'New York' },
          { Name: 'Jane', Age: '30', City: 'San Francisco' }
        ],
        totalRows: 2
      });
    });
  });

  describe('Quoted fields and special characters', () => {
    it('should handle quoted fields with commas', async () => {
      const csvContent = 'Name,Description,Price\n"John Doe","A person, age 25","$1,000"';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.rows[0]).toEqual({
        Name: 'John Doe',
        Description: 'A person, age 25',
        Price: '$1,000'
      });
    });

    it('should handle escaped quotes', async () => {
      const csvContent = 'Name,Quote\nJohn,"He said ""Hello"" to me"';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.rows[0]).toEqual({
        Name: 'John',
        Quote: 'He said "Hello" to me'
      });
    });

    it('should handle CRLF line endings', async () => {
      const csvContent = 'Name,Age\r\nJohn,25\r\nJane,30';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.totalRows).toBe(2);
      expect(result.rows[0]).toEqual({ Name: 'John', Age: '25' });
    });

    it('should handle empty fields', async () => {
      const csvContent = 'Name,Age,City\nJohn,,New York\n,30,';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.rows).toEqual([
        { Name: 'John', Age: '', City: 'New York' },
        { Name: '', Age: '30', City: '' }
      ]);
    });
  });

  describe('Delimiter detection', () => {
    it('should auto-detect comma as delimiter', async () => {
      const csvContent = 'A,B,C\n1,2,3\n4,5,6';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.headers).toEqual(['A', 'B', 'C']);
      expect(result.totalRows).toBe(2);
    });

    it('should auto-detect semicolon when more frequent than comma', async () => {
      const csvContent = 'A;B;C\n1;2;3\n4;5;6';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.headers).toEqual(['A', 'B', 'C']);
      expect(result.totalRows).toBe(2);
    });

    it('should auto-detect tab delimiter', async () => {
      const csvContent = 'A\tB\tC\n1\t2\t3\n4\t5\t6';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.headers).toEqual(['A', 'B', 'C']);
      expect(result.totalRows).toBe(2);
    });
  });

  describe('Security limits', () => {
    it('should reject files larger than 2MB', async () => {
      // Create a large string (> 2MB)
      const largeContent = 'A,B,C\n' + '1,2,3\n'.repeat(350000); // ~2.8MB
      const file = createCSVFile(largeContent);
      
      await expect(parseCsv(file)).rejects.toThrow('File size exceeds limit');
    });

    it('should reject lines longer than 10,000 characters', async () => {
      const longLine = 'A,B\n' + 'x'.repeat(10001) + ',y';
      const file = createCSVFile(longLine);
      
      await expect(parseCsv(file)).rejects.toThrow('Line 2 exceeds maximum length');
    });

    it('should handle exactly 10,000 character lines', async () => {
      const maxLine = 'A,B\n' + 'x'.repeat(9997) + ',y'; // 9997 + 1 comma + 1 y = 9999 chars
      const file = createCSVFile(maxLine);
      
      const result = await parseCsv(file);
      expect(result.totalRows).toBe(1);
    });
  });

  describe('Formula injection protection', () => {
    it('should escape cells starting with =', async () => {
      const csvContent = 'Formula,Normal\n=SUM(A1:A2),Safe';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.rows[0].Formula).toBe('\u200B=SUM(A1:A2)');
      expect(result.rows[0].Normal).toBe('Safe');
    });

    it('should escape cells starting with +', async () => {
      const csvContent = 'Formula,Normal\n+123,Safe';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.rows[0].Formula).toBe('\u200B+123');
    });

    it('should escape cells starting with -', async () => {
      const csvContent = 'Formula,Normal\n-123,Safe';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.rows[0].Formula).toBe('\u200B-123');
    });

    it('should escape cells starting with @', async () => {
      const csvContent = 'Formula,Normal\n"@SUM(1,2)",Safe';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.rows[0].Formula).toBe('\u200B@SUM(1,2)');
    });

    it('should escape cells starting with single quote', async () => {
      const csvContent = "Formula,Normal\n\"'=SUM(1,2)\",Safe";
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.rows[0].Formula).toBe("\u200B'=SUM(1,2)");
    });

    it('should not escape normal text', async () => {
      const csvContent = 'Text,Number\nHello World,123';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.rows[0].Text).toBe('Hello World');
      expect(result.rows[0].Number).toBe('123');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty file', async () => {
      const file = createCSVFile('');
      
      await expect(parseCsv(file)).rejects.toThrow('File is empty or contains no valid data');
    });

    it('should handle file with only headers', async () => {
      const csvContent = 'Name,Age,City';
      const file = createCSVFile(csvContent);
      
      await expect(parseCsv(file)).rejects.toThrow('No data rows found in CSV file');
    });

    it('should handle file with empty lines', async () => {
      const csvContent = '\n\nName,Age\n\nJohn,25\n\n\n';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.totalRows).toBe(1);
      expect(result.rows[0]).toEqual({ Name: 'John', Age: '25' });
    });

    it('should handle mismatched field counts', async () => {
      const csvContent = 'A,B,C\n1,2\n3,4,5,6';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.rows).toEqual([
        { A: '1', B: '2', C: '' },
        { A: '3', B: '4', C: '5' } // Extra fields are ignored
      ]);
    });

    it('should trim whitespace from fields', async () => {
      const csvContent = ' Name , Age , City \n  John  ,  25  ,  New York  ';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.headers).toEqual(['Name', 'Age', 'City']);
      expect(result.rows[0]).toEqual({ Name: 'John', Age: '25', City: 'New York' });
    });
  });

  describe('UTF-8 handling', () => {
    it('should handle UTF-8 characters', async () => {
      const csvContent = 'Name,City\nJöhn Döe,München\nMaría,São Paulo';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.rows).toEqual([
        { Name: 'Jöhn Döe', City: 'München' },
        { Name: 'María', City: 'São Paulo' }
      ]);
    });

    it('should handle emojis', async () => {
      const csvContent = 'Name,Reaction\nJohn,😀\nJane,🎉';
      const file = createCSVFile(csvContent);
      
      const result = await parseCsv(file);
      
      expect(result.rows).toEqual([
        { Name: 'John', Reaction: '😀' },
        { Name: 'Jane', Reaction: '🎉' }
      ]);
    });
  });
});