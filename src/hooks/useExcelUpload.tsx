import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { validateUpload, validateRowCount } from '@/lib/uploadValidation';
import { sanitizeRecords, hasAnySanitization } from '@/lib/csvSanitizer';

export const useExcelUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const uploadExcelFile = async (file: File) => {
    setIsUploading(true);
    try {
      // Step 1: Validate file type and size before parsing
      const preValidation = validateUpload(file);
      if (!preValidation.isValid) {
        let errorMessage = 'File validation failed';
        
        switch (preValidation.error) {
          case 'tooLarge': {
            const maxSizeMB = Math.round((preValidation.details?.maxSize || 0) / (1024 * 1024));
            errorMessage = t('tooLarge', { maxSize: maxSizeMB });
            break;
          }
          case 'xlsxDisabled':
            errorMessage = t('xlsxDisabledCsvAvailable');
            break;
          default:
            errorMessage = 'Unsupported file type';
        }
        
        toast({
          title: 'Upload Fehler',
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, error: preValidation.error };
      }

      // Step 2: Parse file
      const data = await parseFile(file);
      
      // Step 3: Validate row count after parsing
      const totalRows = data.sheets.reduce((sum: number, sheet: ParsedSheet) => sum + sheet.rowCount, 0);
      const postValidation = validateRowCount(totalRows);
      
      if (!postValidation.isValid && postValidation.error === 'tooManyRows') {
        const errorMessage = t('tooManyRows', { 
          maxRows: postValidation.details?.maxRows || 50000 
        });
        
        toast({
          title: 'Upload Fehler',
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, error: postValidation.error };
      }
      
      // Step 4: Upload to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('excel-files')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Step 5: Show success message and sanitization notice if applicable
      toast({
        title: 'Upload erfolgreich',
        description: `Datei wurde hochgeladen: ${data.sheets.length} Arbeitsblätter gefunden`,
      });
      
      if (data.wasSanitized) {
        toast({
          title: 'Sicherheitshinweis',
          description: t('sanitizedNotice'),
          variant: 'default',
        });
      }

      return { success: true, data, fileName };
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Fehler',
        description: 'Die Datei konnte nicht verarbeitet werden',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setIsUploading(false);
    }
  };

interface ParsedSheet {
  name: string;
  data: Record<string, unknown>[];
  rowCount: number;
}

interface ParsedData {
  sheets: ParsedSheet[];
  totalSheets: number;
  totalRows: number;
  wasSanitized?: boolean;
}

  const parseFile = (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
          let data: ParsedData;
          let wasSanitized = false;
          
          if (isCsv) {
            // Parse CSV
            const csvText = e.target?.result as string;
            const jsonData = parseCSV(csvText);
            
            // Apply sanitization to CSV data only
            const originalData = [...jsonData];
            const sanitizedData = sanitizeRecords(jsonData);
            wasSanitized = hasAnySanitization(originalData, sanitizedData);
            
            data = {
              sheets: [{
                name: 'CSV Data',
                data: sanitizedData,
                rowCount: sanitizedData.length
              }],
              totalSheets: 1,
              totalRows: sanitizedData.length,
              wasSanitized
            };
          } else {
            // Parse Excel file (XLSX/XLS) - no sanitization applied
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const workbookData = new Uint8Array(arrayBuffer);
            const workbook = XLSX.read(workbookData, { type: 'array' });
            
            const sheets: ParsedSheet[] = workbook.SheetNames.map(name => {
              const worksheet = workbook.Sheets[name];
              const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
              return {
                name,
                data: jsonData,
                rowCount: jsonData.length
              };
            });

            data = {
              sheets,
              totalSheets: sheets.length,
              totalRows: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0),
              wasSanitized: false
            };
          }
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
      
      // Read file based on type
      const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
      if (isCsv) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  /**
   * Simple CSV parser (basic implementation)
   * For production, consider using a library like Papa Parse
   */
  const parseCSV = (csvText: string): Record<string, unknown>[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // Parse header row
    const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''));
    
    // Parse data rows
    const data: Record<string, unknown>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(value => value.trim().replace(/^"|"$/g, ''));
      const row: Record<string, unknown> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
    return data;
  };

  const getUploadedFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('excel-files')
        .list();

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
      return [];
    }
  };

  return {
    uploadExcelFile,
    parseFile,
    getUploadedFiles,
    isUploading
  };
};