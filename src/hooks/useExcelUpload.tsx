import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { validateFileSize, validateRowCount } from '@/lib/uploadValidation';
import { sanitizeRecord } from '@/lib/csvSanitizer';
import { getXlsxImportEnabled } from '@/lib/uploadLimits';

interface ParsedFileData {
  sheets: Array<{
    name: string;
    data: Record<string, unknown>[];
    rowCount: number;
  }>;
  totalSheets: number;
  totalRows: number;
  isCsv?: boolean;
  sanitizedRowCount?: number;
}

export const useExcelUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Helper function to detect CSV files
  const isCsvFile = (file: File): boolean => {
    return file.type === 'text/csv' || 
           file.name.toLowerCase().endsWith('.csv');
  };

  // Helper function to detect XLSX/XLS files
  const isExcelFile = (file: File): boolean => {
    const xlsxTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    return xlsxTypes.includes(file.type) || 
           file.name.toLowerCase().match(/\.(xlsx?|xls)$/);
  };

  const uploadExcelFile = async (file: File) => {
    setIsUploading(true);
    try {
      // Step 1: File size validation (applies to all files)
      const sizeValidation = validateFileSize(file);
      if (!sizeValidation.ok) {
        toast({
          title: 'Upload Fehler',
          description: t('upload.tooLarge', { limitMB: sizeValidation.limitMB }),
          variant: 'destructive',
        });
        return { success: false, error: 'File too large' };
      }

      // Step 2: Check file type and feature flags
      const isXlsx = isExcelFile(file);
      const isCsv = isCsvFile(file);
      
      if (isXlsx && !getXlsxImportEnabled()) {
        toast({
          title: 'XLSX Import deaktiviert',
          description: t('upload.xlsxDisabledCsvAvailable'),
          variant: 'destructive',
        });
        return { success: false, error: 'XLSX import disabled' };
      }

      if (!isXlsx && !isCsv) {
        toast({
          title: 'Nicht unterstütztes Format',
          description: t('pleaseSelectExcelFile'),
          variant: 'destructive',
        });
        return { success: false, error: 'Unsupported file format' };
      }

      // Step 3: Parse file (different handling for CSV vs XLSX)
      const data = await parseExcelFile(file);
      
      // Step 4: Row count validation
      const rowValidation = validateRowCount(data.totalRows);
      if (!rowValidation.ok) {
        toast({
          title: 'Zu viele Zeilen',
          description: t('upload.tooManyRows', { rows: data.totalRows, limit: rowValidation.limit }),
          variant: 'destructive',
        });
        return { success: false, error: 'Too many rows' };
      }

      // Step 5: Upload to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('excel-files')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Show success message
      const fileTypeLabel = isCsv ? 'CSV' : 'Excel';
      let description = `${fileTypeLabel}-Datei wurde hochgeladen: ${data.sheets.length} Arbeitsblätter gefunden`;
      
      // Add sanitization notice for CSV files
      if (isCsv && data.sanitizedRowCount > 0) {
        description += `. ${t('upload.sanitizedNotice')}`;
      }
      
      toast({
        title: 'Upload erfolgreich',
        description,
      });

      return { success: true, data, fileName };
    } catch (error) {
      console.error('File upload error:', error);
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

  const parseExcelFile = (file: File): Promise<ParsedFileData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const isCsv = isCsvFile(file);
          let sanitizedRowCount = 0;
          
          const sheets = workbook.SheetNames.map(name => {
            const worksheet = workbook.Sheets[name];
            let jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Apply CSV sanitization only for CSV files
            if (isCsv && jsonData.length > 0) {
              const originalData = [...jsonData];
              jsonData = jsonData.map(row => sanitizeRecord(row));
              
              // Check if any cells were sanitized (for notification)
              const wasSanitized = originalData.some((original, index) => {
                const sanitized = jsonData[index];
                return Object.keys(original).some(key => original[key] !== sanitized[key]);
              });
              
              if (wasSanitized) {
                sanitizedRowCount++;
              }
            }
            
            return {
              name,
              data: jsonData,
              rowCount: jsonData.length
            };
          });

          // Show sanitization notice for CSV files if cells were sanitized
          if (isCsv && sanitizedRowCount > 0) {
            // Note: We'll show this after upload success, not here to avoid multiple toasts
          }

          resolve({
            sheets,
            totalSheets: sheets.length,
            totalRows: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0),
            isCsv,
            sanitizedRowCount
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