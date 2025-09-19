/**
 * Unified Excel adapter using ExcelJS
 * Provides secure reading and writing of Excel files with defensive parsing
 */

interface ExcelSheet {
  name: string;
  rows: string[][];
}

interface ExcelWorkbook {
  sheets: ExcelSheet[];
}

/**
 * Reads an Excel workbook from File or ArrayBuffer
 * @param file - File object or ArrayBuffer containing Excel data
 * @returns Promise resolving to workbook with normalized sheet data
 */
export async function readWorkbook(file: File | ArrayBuffer): Promise<ExcelWorkbook> {
  try {
    // Lazy import ExcelJS to avoid loading it unnecessarily
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    
    let buffer: ArrayBuffer;
    if (file instanceof File) {
      buffer = await file.arrayBuffer();
    } else {
      buffer = file;
    }
    
    await workbook.xlsx.load(buffer);
    
    const sheets: ExcelSheet[] = [];
    
    workbook.worksheets.forEach(worksheet => {
      const rows: string[][] = [];
      
      // Get all rows with data
      worksheet.eachRow((row, rowNumber) => {
        const rowData: string[] = [];
        
        // Process each cell in the row
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          let cellValue = '';
          
          // Defensive parsing: coerce all values to strings
          if (cell.value !== null && cell.value !== undefined) {
            // Handle different cell value types
            if (typeof cell.value === 'object' && cell.value !== null) {
              // Handle formula results, rich text, etc.
              if ('result' in cell.value) {
                cellValue = String(cell.value.result || '');
              } else if ('richText' in cell.value) {
                cellValue = cell.value.richText?.map((rt: any) => rt.text).join('') || '';
              } else if ('text' in cell.value) {
                cellValue = String(cell.value.text || '');
              } else {
                // For any other object type, stringify it
                cellValue = String(cell.value);
              }
            } else {
              cellValue = String(cell.value);
            }
          }
          
          // Security: Strip dangerous prototype properties if found
          if (typeof cellValue === 'string') {
            if (cellValue.includes('__proto__') || cellValue.includes('constructor')) {
              console.warn('Potentially dangerous content found in cell, sanitizing');
              cellValue = cellValue.replace(/__proto__|constructor/g, '[SANITIZED]');
            }
          }
          
          rowData[colNumber - 1] = cellValue;
        });
        
        // Ensure row array has consistent length by filling empty cells
        const maxCol = worksheet.columnCount || rowData.length;
        while (rowData.length < maxCol) {
          rowData.push('');
        }
        
        rows.push(rowData);
      });
      
      sheets.push({
        name: worksheet.name || `Sheet${sheets.length + 1}`,
        rows: rows
      });
    });
    
    return { sheets };
    
  } catch (error) {
    throw new Error(`Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Writes an Excel workbook to a Blob
 * @param sheets - Array of sheets with names and row data
 * @returns Promise resolving to Excel file as Blob
 */
export async function writeWorkbook(sheets: Array<{ name: string; rows: (string | number | null | undefined)[][] }>): Promise<Blob> {
  try {
    // Lazy import ExcelJS
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Travel AutoLog';
    workbook.lastModifiedBy = 'Travel AutoLog';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    for (const sheetData of sheets) {
      // Sanitize sheet name
      const sanitizedName = sheetData.name.replace(/[\\\/\*\?\[\]:]/g, '_').substring(0, 31);
      const worksheet = workbook.addWorksheet(sanitizedName);
      
      // Add data to worksheet
      sheetData.rows.forEach((row, rowIndex) => {
        const sanitizedRow = row.map(cell => {
          // Normalize cell values to safe primitives
          if (cell === null || cell === undefined) {
            return '';
          }
          
          // If it's already a primitive type, return as-is
          if (typeof cell === 'string' || typeof cell === 'number') {
            return cell;
          }
          
          // For any other type, convert to string
          return String(cell);
        });
        
        worksheet.addRow(sanitizedRow);
      });
      
      // Auto-size columns for better readability
      worksheet.columns.forEach(column => {
        if (column.values) {
          const lengths = column.values.map((v: any) => v ? v.toString().length : 0);
          const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        }
      });
    }
    
    // Generate buffer and return as Blob
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
  } catch (error) {
    throw new Error(`Failed to write Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}