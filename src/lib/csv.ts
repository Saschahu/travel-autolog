// CSV parsing functionality to match XLSX interface

export interface CsvSheetData {
  name: string;
  data: Record<string, unknown>[];
  rowCount: number;
}

export interface CsvParseResult {
  sheets: CsvSheetData[];
  totalSheets: number;
  totalRows: number;
}

export const parseCsv = (file: File): Promise<CsvParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const jsonData = csvToJson(csvText);
        
        const sheet: CsvSheetData = {
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          data: jsonData,
          rowCount: jsonData.length
        };

        resolve({
          sheets: [sheet],
          totalSheets: 1,
          totalRows: jsonData.length
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('CSV-Datei konnte nicht gelesen werden'));
    reader.readAsText(file, 'UTF-8');
  });
};

const csvToJson = (csvText: string): Record<string, unknown>[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  const result: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, unknown> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    result.push(row);
  }

  return result;
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Handle escaped quotes
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};