import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { ENABLE_XLSX } from '@/lib/flags';
import { parseCsv } from '@/lib/csv';

// Common interface for tabular data from both XLSX and CSV
interface TabularDataResult {
  sheets: Array<{
    name: string;
    data: Record<string, string>[];
    rowCount: number;
  }>;
  totalSheets: number;
  totalRows: number;
}

export const useExcelUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadExcelFile = async (file: File) => {
    setIsUploading(true);
    try {
      // Parse file based on type and feature flags
      const data = await parseFile(file);
      
      // Upload to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('excel-files')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const description = isExcel 
        ? `Excel-Datei wurde hochgeladen: ${data.sheets.length} Arbeitsblätter gefunden`
        : `CSV-Datei wurde hochgeladen: ${data.totalRows} Zeilen gefunden`;

      toast({
        title: 'Upload erfolgreich',
        description,
      });

      return { success: true, data, fileName };
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: 'Upload Fehler',
        description: error instanceof Error ? error.message : 'Die Datei konnte nicht verarbeitet werden',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setIsUploading(false);
    }
  };

  const parseFile = async (file: File): Promise<TabularDataResult> => {
    const isCsv = file.name.endsWith('.csv');
    
    if (isCsv) {
      // CSV files are always supported
      return await parseCsvFile(file);
    } else {
      // XLSX/XLS files require feature flag
      if (!ENABLE_XLSX) {
        throw new Error('XLSX import is disabled by feature flag');
      }
      return await parseExcelFile(file);
    }
  };

  const parseCsvFile = async (file: File): Promise<TabularDataResult> => {
    const csvResult = await parseCsv(file);
    
    // Convert to same format as Excel parser
    return {
      sheets: [{
        name: 'Sheet1',
        data: csvResult.rows,
        rowCount: csvResult.rowCount
      }],
      totalSheets: 1,
      totalRows: csvResult.rowCount
    };
  };

  const parseExcelFile = (file: File): Promise<TabularDataResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const sheets = workbook.SheetNames.map(name => {
            const worksheet = workbook.Sheets[name];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, string>[];
            return {
              name,
              data: jsonData,
              rowCount: jsonData.length
            };
          });

          resolve({
            sheets,
            totalSheets: sheets.length,
            totalRows: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0)
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
      reader.readAsArrayBuffer(file);
    });
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
    parseExcelFile,
    parseFile,
    getUploadedFiles,
    isUploading
  };
};