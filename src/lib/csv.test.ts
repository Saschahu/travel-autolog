import { describe, it, expect, vi } from 'vitest';
import { parseCsv, CsvError } from './csv';

describe('CSV Parser', () => {
  // Helper function to create a File object from text that works in test environment
  function createFile(content: string, filename = 'test.csv'): File {
    const size = new TextEncoder().encode(content).byteLength;
    return {
      name: filename,
      size: size,
      type: 'text/csv',
      lastModified: Date.now(),
      text: vi.fn().mockResolvedValue(content),
      stream: vi.fn(),
      arrayBuffer: vi.fn(),
      slice: vi.fn(),
      webkitRelativePath: '',
    } as File;
  }

  describe('Delimiter Detection', () => {
    it('should detect comma delimiter', async () => {
      const content = 'Name,Age,City\nJohn,25,NYC\nJane,30,LA';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.headers).toEqual(['Name', 'Age', 'City']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ Name: 'John', Age: '25', City: 'NYC' });
    });

    it('should detect semicolon delimiter', async () => {
      const content = 'Name;Age;City\nJohn;25;NYC\nJane;30;LA';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.headers).toEqual(['Name', 'Age', 'City']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ Name: 'John', Age: '25', City: 'NYC' });
    });

    it('should detect tab delimiter', async () => {
      const content = 'Name\tAge\tCity\nJohn\t25\tNYC\nJane\t30\tLA';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.headers).toEqual(['Name', 'Age', 'City']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ Name: 'John', Age: '25', City: 'NYC' });
    });

    it('should choose delimiter with most occurrences', async () => {
      const content = 'A;B,C;D\nvalue1;value2,value3;value4\nval1;val2,val3;val4';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      // Semicolon appears more often (3 times per line) than comma (1 time per line)
      expect(result.headers).toEqual(['A', 'B,C', 'D']);
    });
  });

  describe('Quotes and Escaped Quotes', () => {
    it('should handle quoted fields', async () => {
      const content = 'Name,Description\n"John Doe","A nice person"\n"Jane Smith","Another person"';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows[0]).toEqual({ Name: 'John Doe', Description: 'A nice person' });
      expect(result.rows[1]).toEqual({ Name: 'Jane Smith', Description: 'Another person' });
    });

    it('should handle escaped quotes', async () => {
      const content = 'Name,Quote\n"John","He said ""Hello world"""\n"Jane","She said ""Goodbye"""';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows[0]).toEqual({ Name: 'John', Quote: 'He said "Hello world"' });
      expect(result.rows[1]).toEqual({ Name: 'Jane', Quote: 'She said "Goodbye"' });
    });

    it('should handle fields with commas in quotes', async () => {
      const content = 'Name,Address\n"John Doe","123 Main St, NYC"\n"Jane Smith","456 Oak Ave, LA"';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows[0]).toEqual({ Name: 'John Doe', Address: '123 Main St, NYC' });
      expect(result.rows[1]).toEqual({ Name: 'Jane Smith', Address: '456 Oak Ave, LA' });
    });
  });

  describe('CRLF Line Endings', () => {
    it('should handle CRLF line endings', async () => {
      const content = 'Name,Age\r\nJohn,25\r\nJane,30';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.headers).toEqual(['Name', 'Age']);
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]).toEqual({ Name: 'John', Age: '25' });
      expect(result.rows[1]).toEqual({ Name: 'Jane', Age: '30' });
    });

    it('should handle mixed line endings', async () => {
      const content = 'Name,Age\r\nJohn,25\nJane,30\r\nBob,35';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows).toHaveLength(3);
      expect(result.rows[2]).toEqual({ Name: 'Bob', Age: '35' });
    });
  });

  describe('BOM Removal', () => {
    it('should remove BOM from UTF-8 files', async () => {
      const content = '\uFEFFName,Age\nJohn,25\nJane,30';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.headers).toEqual(['Name', 'Age']);
      expect(result.rows[0]).toEqual({ Name: 'John', Age: '25' });
    });
  });

  describe('Safety Limits', () => {
    it('should throw FILE_TOO_LARGE error for files over 2MB', async () => {
      // Create a large content string (over 2MB)
      const largeContent = 'A,B\n' + 'x,y\n'.repeat(300000); // Each line is ~4 bytes, 300k lines = ~1.2MB of data, but let's make it larger
      const veryLargeContent = largeContent + largeContent; // ~2.4MB
      
      // Create file with size over limit
      const file = createFile(veryLargeContent, 'large.csv');
      
      await expect(parseCsv(file)).rejects.toThrow(CsvError);
      try {
        await parseCsv(file);
      } catch (error) {
        expect(error).toBeInstanceOf(CsvError);
        expect((error as CsvError).code).toBe('FILE_TOO_LARGE');
      }
    });

    it('should throw ROW_TOO_LONG error for rows over 10k characters', async () => {
      const longValue = 'x'.repeat(10001);
      const content = `Name,Value\nJohn,${longValue}`;
      const file = createFile(content);
      
      await expect(parseCsv(file)).rejects.toThrow(CsvError);
      try {
        await parseCsv(file);
      } catch (error) {
        expect(error).toBeInstanceOf(CsvError);
        expect((error as CsvError).code).toBe('ROW_TOO_LONG');
      }
    });
  });

  describe('Formula Injection Prevention', () => {
    it('should prefix dangerous cells starting with =', async () => {
      const content = 'Formula,Value\n=1+1,safe\n=SUM(A1:A2),another';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows[0].Formula).toBe('\u200B=1+1');
      expect(result.rows[0].Value).toBe('safe');
      expect(result.rows[1].Formula).toBe('\u200B=SUM(A1:A2)');
    });

    it('should prefix dangerous cells starting with +', async () => {
      const content = 'Formula,Value\n+SUM(A1),safe';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows[0].Formula).toBe('\u200B+SUM(A1)');
      expect(result.rows[0].Value).toBe('safe');
    });

    it('should prefix dangerous cells starting with -', async () => {
      const content = 'Formula,Value\n-1,safe';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows[0].Formula).toBe('\u200B-1');
      expect(result.rows[0].Value).toBe('safe');
    });

    it('should prefix dangerous cells starting with @', async () => {
      const content = 'Formula,Value\n@foo,safe';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows[0].Formula).toBe('\u200B@foo');
      expect(result.rows[0].Value).toBe('safe');
    });

    it("should prefix dangerous cells starting with '", async () => {
      const content = "Formula,Value\n'bar,safe";
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows[0].Formula).toBe("\u200B'bar");
      expect(result.rows[0].Value).toBe('safe');
    });

    it('should not prefix safe cells', async () => {
      const content = 'Name,Age,Comment\nJohn,25,Good person\nJane,30,Nice work';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows[0].Name).toBe('John');
      expect(result.rows[0].Age).toBe('25');
      expect(result.rows[0].Comment).toBe('Good person');
    });
  });

  describe('Happy Path and Edge Cases', () => {
    it('should handle empty CSV file', async () => {
      const content = '';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
      expect(result.totalRows).toBe(0);
    });

    it('should handle CSV with only headers', async () => {
      const content = 'Name,Age,City';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.headers).toEqual(['Name', 'Age', 'City']);
      expect(result.rows).toEqual([]);
      expect(result.totalRows).toBe(0);
    });

    it('should handle missing columns (pad with empty strings)', async () => {
      const content = 'Name,Age,City\nJohn,25\nJane,30,LA,Extra';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows[0]).toEqual({ Name: 'John', Age: '25', City: '' });
      expect(result.rows[1]).toEqual({ Name: 'Jane', Age: '30', City: 'LA' }); // Extra column ignored
    });

    it('should trim headers', async () => {
      const content = ' Name , Age , City \nJohn,25,NYC';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.headers).toEqual(['Name', 'Age', 'City']);
    });

    it('should handle empty cells', async () => {
      const content = 'Name,Age,City\nJohn,,NYC\n,30,\nJane,25,LA';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows[0]).toEqual({ Name: 'John', Age: '', City: 'NYC' });
      expect(result.rows[1]).toEqual({ Name: '', Age: '30', City: '' });
      expect(result.rows[2]).toEqual({ Name: 'Jane', Age: '25', City: 'LA' });
    });

    it('should skip empty lines', async () => {
      const content = 'Name,Age\n\nJohn,25\n\n\nJane,30\n';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.rows).toHaveLength(2);
      expect(result.totalRows).toBe(2);
    });

    it('should return correct totalRows', async () => {
      const content = 'Name,Age\nJohn,25\nJane,30\nBob,35';
      const file = createFile(content);
      const result = await parseCsv(file);
      
      expect(result.totalRows).toBe(3);
      expect(result.rows.length).toBe(3);
    });
  });
});