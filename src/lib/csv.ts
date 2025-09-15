export interface CsvRow {
  [key: string]: string;
}

export async function parseCsv(file: File): Promise<{ rows: CsvRow[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          throw new Error('Datei ist leer oder konnte nicht gelesen werden');
        }

        // Auto-detect delimiter: try comma first, then semicolon
        const commaCount = (text.match(/,/g) || []).length;
        const semicolonCount = (text.match(/;/g) || []).length;
        const delimiter = semicolonCount > commaCount ? ';' : ',';

        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        if (lines.length === 0) {
          throw new Error('CSV-Datei enthält keine Daten');
        }

        // First line is header
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine, delimiter).map(header => header.trim());
        
        if (headers.length === 0) {
          throw new Error('CSV-Header konnte nicht gefunden werden');
        }

        // Parse data rows
        const rows: CsvRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const dataLine = lines[i];
          if (dataLine.trim()) {
            const values = parseCSVLine(dataLine, delimiter);
            const row: CsvRow = {};
            
            // Map values to headers
            headers.forEach((header, index) => {
              row[header] = (values[index] || '').trim();
            });
            
            rows.push(row);
          }
        }

        resolve({ rows });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.readAsText(file, 'utf-8');
  });
}

// Simple CSV line parser with basic quoted value support
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Handle quotes - basic support for escaped quotes
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // Field separator outside quotes
      result.push(current);
      current = '';
    } else {
      // Regular character
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}