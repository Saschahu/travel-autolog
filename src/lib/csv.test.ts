import { describe, it, expect } from 'vitest';
import { parseCsv } from './csv';

describe('parseCsv', () => {
  it('should parse comma-separated CSV correctly', async () => {
    const csvContent = `Name,Age,City
John Doe,30,New York
Jane Smith,25,Los Angeles
Bob Johnson,35,Chicago`;

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const result = await parseCsv(file);

    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toEqual({
      Name: 'John Doe',
      Age: '30',
      City: 'New York'
    });
    expect(result.rows[1]).toEqual({
      Name: 'Jane Smith',
      Age: '25',
      City: 'Los Angeles'
    });
    expect(result.rows[2]).toEqual({
      Name: 'Bob Johnson',
      Age: '35',
      City: 'Chicago'
    });
  });

  it('should parse semicolon-separated CSV correctly', async () => {
    const csvContent = `Name;Age;City
John Doe;30;New York
Jane Smith;25;Los Angeles
Bob Johnson;35;Chicago`;

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const result = await parseCsv(file);

    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toEqual({
      Name: 'John Doe',
      Age: '30',
      City: 'New York'
    });
    expect(result.rows[1]).toEqual({
      Name: 'Jane Smith',
      Age: '25',
      City: 'Los Angeles'
    });
    expect(result.rows[2]).toEqual({
      Name: 'Bob Johnson',
      Age: '35',
      City: 'Chicago'
    });
  });

  it('should handle quoted values with commas correctly', async () => {
    const csvContent = `Name,Description,Price
"Apple iPhone","High-quality smartphone, latest model",999
"Samsung Galaxy","Android phone, great camera",799
"Google Pixel","Pure Android experience, excellent photos",699`;

    const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
    const result = await parseCsv(file);

    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toEqual({
      Name: 'Apple iPhone',
      Description: 'High-quality smartphone, latest model',
      Price: '999'
    });
    expect(result.rows[1]).toEqual({
      Name: 'Samsung Galaxy',
      Description: 'Android phone, great camera',
      Price: '799'
    });
    expect(result.rows[2]).toEqual({
      Name: 'Google Pixel',
      Description: 'Pure Android experience, excellent photos',
      Price: '699'
    });
  });

  it('should handle empty file gracefully', async () => {
    const file = new File([''], 'empty.csv', { type: 'text/csv' });
    
    await expect(parseCsv(file)).rejects.toThrow('Datei ist leer oder konnte nicht gelesen werden');
  });

  it('should handle file with only header', async () => {
    const csvContent = 'Name,Age,City';
    const file = new File([csvContent], 'header-only.csv', { type: 'text/csv' });
    const result = await parseCsv(file);

    expect(result.rows).toHaveLength(0);
  });
});