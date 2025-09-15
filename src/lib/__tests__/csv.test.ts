/**
 * CSV Parser Tests
 * Tests for the CSV parsing functionality
 * Note: These tests require Vitest to be configured in the project
 */

import { describe, it, expect } from 'vitest';
import { parseCsv } from '../csv';

// Helper function to create a File from text content
function createCsvFile(content: string, filename = 'test.csv'): File {
  return new File([content], filename, { type: 'text/csv' });
}

describe('CSV Parser', () => {
  it('should parse CSV with comma delimiter', async () => {
    const csvContent = `Name,Age,City
John,25,New York
Jane,30,Los Angeles`;
    
    const file = createCsvFile(csvContent);
    const result = await parseCsv(file);
    
    expect(result.delimiter).toBe(',');
    expect(result.rowCount).toBe(2);
    expect(result.rows).toEqual([
      { Name: 'John', Age: '25', City: 'New York' },
      { Name: 'Jane', Age: '30', City: 'Los Angeles' }
    ]);
  });

  it('should parse CSV with semicolon delimiter', async () => {
    const csvContent = `Name;Age;City
John;25;New York
Jane;30;Los Angeles`;
    
    const file = createCsvFile(csvContent);
    const result = await parseCsv(file);
    
    expect(result.delimiter).toBe(';');
    expect(result.rowCount).toBe(2);
    expect(result.rows).toEqual([
      { Name: 'John', Age: '25', City: 'New York' },
      { Name: 'Jane', Age: '30', City: 'Los Angeles' }
    ]);
  });

  it('should handle quoted fields with delimiters inside', async () => {
    const csvContent = `Name,Description,Price
"Product A","High quality, durable",29.99
"Product B","Lightweight, portable",19.99`;
    
    const file = createCsvFile(csvContent);
    const result = await parseCsv(file);
    
    expect(result.delimiter).toBe(',');
    expect(result.rowCount).toBe(2);
    expect(result.rows).toEqual([
      { Name: 'Product A', Description: 'High quality, durable', Price: '29.99' },
      { Name: 'Product B', Description: 'Lightweight, portable', Price: '19.99' }
    ]);
  });

  it('should ignore empty lines', async () => {
    const csvContent = `Name,Age,City

John,25,New York

Jane,30,Los Angeles

`;
    
    const file = createCsvFile(csvContent);
    const result = await parseCsv(file);
    
    expect(result.delimiter).toBe(',');
    expect(result.rowCount).toBe(2);
    expect(result.rows).toEqual([
      { Name: 'John', Age: '25', City: 'New York' },
      { Name: 'Jane', Age: '30', City: 'Los Angeles' }
    ]);
  });

  it('should auto-detect semicolon delimiter over comma', async () => {
    const csvContent = `First Name;Last Name;Email;Phone
John;Doe;john@example.com;+1,555,123-4567
Jane;Smith;jane@example.com;+1,555,987-6543`;
    
    const file = createCsvFile(csvContent);
    const result = await parseCsv(file);
    
    expect(result.delimiter).toBe(';');
    expect(result.rowCount).toBe(2);
    expect(result.rows[0]['Phone']).toBe('+1,555,123-4567');
  });

  it('should handle empty CSV file', async () => {
    const csvContent = '';
    
    const file = createCsvFile(csvContent);
    const result = await parseCsv(file);
    
    expect(result.delimiter).toBe(',');
    expect(result.rowCount).toBe(0);
    expect(result.rows).toEqual([]);
  });

  it('should handle CSV with only headers', async () => {
    const csvContent = 'Name,Age,City';
    
    const file = createCsvFile(csvContent);
    const result = await parseCsv(file);
    
    expect(result.delimiter).toBe(',');
    expect(result.rowCount).toBe(0);
    expect(result.rows).toEqual([]);
  });
});