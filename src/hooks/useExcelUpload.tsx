import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isXlsxEnabled } from '@/lib/flags';

interface ParsedSheet {
  name: string;
  data: unknown[];
  rowCount: number;
}

interface ParsedData {
  sheets: ParsedSheet[];
  totalSheets: number;
  totalRows: number;
}

export const useExcelUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const uploadExcelFile = async (file: File) => {
    setIsUploading(true);
    try {
      // Check if XLSX files are blocked by feature flag
      const isXlsxFile = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
      if (isXlsxFile && !isXlsxEnabled()) {
        toast({
          title: 'XLSX Upload blockiert',
          description: t('xlsxBlocked'),
          variant: 'destructive',
        });
        return { success: false, error: 'XLSX files not allowed' };
      }

      // Parse Excel/CSV file
      const data = await parseExcelFile(file);
      
      // Upload to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('excel-files')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      toast({
        title: 'Upload erfolgreich',
        description: `Excel-Datei wurde hochgeladen: ${data.sheets.length} Arbeitsblätter gefunden`,
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

  const parseExcelFile = (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const isCSV = file.name.toLowerCase().endsWith('.csv');
          const data = e.target?.result;
          
          let workbook: XLSX.WorkBook;
          
          if (isCSV) {
            // Parse CSV file
            workbook = XLSX.read(data, { type: 'string' });
          } else {
            // Parse XLSX/XLS file
            const arrayBuffer = new Uint8Array(data as ArrayBuffer);
            workbook = XLSX.read(arrayBuffer, { type: 'array' });
          }
          
          const sheets = workbook.SheetNames.map(name => {
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
      
      // Read file based on type
      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
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
    isUploading
  };
};