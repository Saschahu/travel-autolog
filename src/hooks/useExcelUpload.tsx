import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getUploadLimits } from '@/lib/uploadLimits';
import { preValidateFile, postValidateRows } from '@/lib/uploadValidation';
import { sanitizeRecord } from '@/lib/csvSanitizer';

interface ExcelSheet {
  name: string;
  data: Record<string, unknown>[];
  rowCount: number;
}

interface ExcelData {
  sheets: ExcelSheet[];
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
      const limits = getUploadLimits();
      const isXlsxEnabled = import.meta.env.VITE_ENABLE_XLSX === 'true';
      const isCSV = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
      
      // Check if XLSX is disabled and file is XLSX
      if (!isCSV && !isXlsxEnabled) {
        toast({
          title: 'XLSX Import deaktiviert',
          description: t('xlsxDisabledCsvAvailable'),
          variant: 'destructive',
        });
        return { success: false, error: 'XLSX_DISABLED' };
      }

      // Pre-validate file size
      const sizeValidation = preValidateFile(file, limits);
      if (!sizeValidation.ok) {
        toast({
          title: 'Datei zu groß',
          description: t('tooLarge', { limitMB: sizeValidation.details.maxMB }),
          variant: 'destructive',
        });
        return { success: false, error: sizeValidation.code };
      }

      // Parse file
      const data = await parseExcelFile(file);
      
      // Post-validate row count
      const rowValidation = postValidateRows(data.totalRows, limits);
      if (!rowValidation.ok) {
        toast({
          title: 'Zu viele Zeilen',
          description: t('tooManyRows', { limit: rowValidation.details.maxRows }),
          variant: 'destructive',
        });
        return { success: false, error: rowValidation.code };
      }

      // Apply CSV sanitization if it's a CSV file
      let sanitizedCount = 0;
      if (isCSV) {
        data.sheets.forEach(sheet => {
          sheet.data = sheet.data.map((row: Record<string, unknown>) => {
            const original = JSON.stringify(row);
            const sanitized = sanitizeRecord(row);
            if (JSON.stringify(sanitized) !== original) {
              sanitizedCount++;
            }
            return sanitized;
          });
        });

        if (sanitizedCount > 0) {
          toast({
            title: 'Sicherheitshinweis',
            description: t('sanitizedNotice', { count: sanitizedCount }),
          });
        }
      }
      
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
        description: `${isCSV ? 'CSV' : 'Excel'}-Datei wurde hochgeladen: ${data.sheets.length} Arbeitsblätter gefunden`,
      });

      return { success: true, data, fileName };
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

  const parseExcelFile = (file: File): Promise<ExcelData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const sheets: ExcelSheet[] = workbook.SheetNames.map(name => {
            const worksheet = workbook.Sheets[name];
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
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
    isUploading
  };
};