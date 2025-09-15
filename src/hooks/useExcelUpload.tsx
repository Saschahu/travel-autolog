import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { sanitizeRecord } from '@/lib/cellSanitizer';
import { checkLimits, MAX_UPLOAD_BYTES, MAX_UPLOAD_ROWS } from '@/lib/uploadLimits';
import { useTranslation } from 'react-i18next';

export const useExcelUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const uploadExcelFile = async (file: File) => {
    setIsUploading(true);
    try {
      // Check file size limit before processing
      const limitCheck = checkLimits(file.size, 0);
      if (!limitCheck.ok && limitCheck.reason === 'size') {
        const limitMB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));
        toast({
          title: t('error'),
          description: t('upload.tooLarge', { limitMB }),
          variant: 'destructive',
        });
        return { success: false, error: 'File too large' };
      }

      // Parse file (XLSX or CSV)
      const data = await parseFile(file);
      
      // Check row count limit after parsing
      const totalRows = data.totalRows;
      const rowLimitCheck = checkLimits(file.size, totalRows);
      if (!rowLimitCheck.ok && rowLimitCheck.reason === 'rows') {
        toast({
          title: t('error'),
          description: t('upload.tooManyRows', { rows: totalRows, limit: MAX_UPLOAD_ROWS }),
          variant: 'destructive',
        });
        return { success: false, error: 'Too many rows' };
      }

      // Sanitize all data to prevent formula injection
      const sanitizedSheets = data.sheets.map(sheet => ({
        ...sheet,
        data: sheet.data.map(row => sanitizeRecord(row))
      }));

      const sanitizedData = {
        ...data,
        sheets: sanitizedSheets
      };
      
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
        description: `Datei wurde hochgeladen: ${sanitizedData.sheets.length} Arbeitsblätter gefunden`,
      });

      return { success: true, data: sanitizedData, fileName };
    } catch (error) {
      console.error('Excel upload error:', error);
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

  const parseFile = (file: File): Promise<any> => {
    const isCSV = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv';
    
    if (isCSV) {
      return parseCSVFile(file);
    } else {
      return parseExcelFile(file);
    }
  };

  const parseCSVFile = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          
          // Parse CSV using XLSX (which handles CSV well)
          const workbook = XLSX.read(text, { type: 'string' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const sheets = [{
            name: 'CSV Data',
            data: jsonData,
            rowCount: jsonData.length
          }];

          resolve({
            sheets,
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

  const parseExcelFile = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
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
    parseFile,
    parseExcelFile,
    getUploadedFiles,
    isUploading
  };
};