import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { parseCsv } from '@/lib/csv';

interface ParsedSheet {
  name: string;
  data: unknown[];
  rowCount: number;
}

interface ParsedFileData {
  sheets: ParsedSheet[];
  totalSheets: number;
  totalRows: number;
}

export const useExcelUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const ENABLE_XLSX = import.meta.env.VITE_ENABLE_XLSX !== 'false';

  const uploadExcelFile = async (file: File) => {
    setIsUploading(true);
    try {
      // Determine if we should use CSV or XLSX parsing
      const shouldUseCsv = file.name.endsWith('.csv') || !ENABLE_XLSX;
      
      // Parse file
      const data = shouldUseCsv ? await parseCsvFile(file) : await parseExcelFile(file);
      
      // Upload to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('excel-files')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      const fileType = shouldUseCsv ? 'CSV' : 'Excel';
      toast({
        title: 'Upload erfolgreich',
        description: `${fileType}-Datei wurde hochgeladen: ${data.sheets.length} Arbeitsblätter gefunden`,
      });

      return { success: true, data, fileName };
    } catch (error) {
      console.error('Excel upload error:', error);
      toast({
        title: 'Upload Fehler',
        description: 'Die Excel-Datei konnte nicht verarbeitet werden',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setIsUploading(false);
    }
  };

  const parseCsvFile = async (file: File): Promise<ParsedFileData> => {
    try {
      const csvResult = await parseCsv(file);
      
      // Map CSV data to match XLSX schema expected by the rest of the app
      // TODO: This is a basic mapping - may need refinement based on actual CSV structure
      const sheets: ParsedSheet[] = [{
        name: 'Sheet1', // CSV files don't have sheet names, so use default
        data: csvResult.rows, // CSV rows are already in the right format
        rowCount: csvResult.rows.length
      }];

      return {
        sheets,
        totalSheets: sheets.length,
        totalRows: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0)
      };
    } catch (error) {
      throw new Error(`CSV-Parsing Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  };

  const parseExcelFile = (file: File): Promise<ParsedFileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const sheets: ParsedSheet[] = workbook.SheetNames.map(name => {
            const worksheet = workbook.Sheets[name];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
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
    getUploadedFiles,
    isUploading,
    ENABLE_XLSX
  };
};