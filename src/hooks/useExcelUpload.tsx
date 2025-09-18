import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { validateUploadFile } from '@/lib/uploadValidation';
import { validateUploadLimits, formatFileSize, formatRowCount } from '@/lib/uploadLimits';
import { sanitizeRecord, countSanitizedValues } from '@/lib/csvSanitizer';

export const useExcelUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const uploadExcelFile = async (file: File) => {
    setIsUploading(true);
    try {
      // Stage 2 Security: Validate file type and XLSX feature flag
      const typeValidation = await validateUploadFile(file);
      if (!typeValidation.isValid) {
        toast({
          title: t('error'),
          description: t(typeValidation.error || 'unsupportedFileType'),
          variant: 'destructive',
        });
        return { success: false, error: typeValidation.error };
      }

      // Stage 2 Security: Validate file size limits
      const sizeValidation = validateUploadLimits(file);
      if (!sizeValidation.isValid) {
        const errorMessage = sizeValidation.error === 'tooLarge' 
          ? `${t('tooLarge')}: ${formatFileSize(sizeValidation.actualSize!)} > ${formatFileSize(sizeValidation.maxSize!)}`
          : t(sizeValidation.error!);
        
        toast({
          title: t('error'),
          description: errorMessage,
          variant: 'destructive',
        });
        return { success: false, error: sizeValidation.error };
      }

      // Parse file based on type
      let data;
      let sanitizedCount = 0;
      
      if (typeValidation.fileType === 'csv') {
        data = await parseCsvFile(file);
        
        // Stage 2 Security: Validate row count for CSV
        const rowValidation = validateUploadLimits(file, data.data);
        if (!rowValidation.isValid) {
          const errorMessage = rowValidation.error === 'tooManyRows' 
            ? `${t('tooManyRows')}: ${formatRowCount(rowValidation.actualRows!)} > ${formatRowCount(rowValidation.maxRows!)}`
            : t(rowValidation.error!);
          
          toast({
            title: t('error'),
            description: errorMessage,
            variant: 'destructive',
          });
          return { success: false, error: rowValidation.error };
        }

        // Stage 2 Security: Sanitize CSV data to prevent formula injection
        const originalData = data.data;
        data.data = originalData.map((record: Record<string, unknown>) => {
          const originalRecord = { ...record };
          const sanitizedRecord = sanitizeRecord(record);
          const sanitizedInRecord = countSanitizedValues(originalRecord, sanitizedRecord);
          sanitizedCount += sanitizedInRecord;
          return sanitizedRecord;
        });
      } else {
        // Excel file - use existing parsing
        data = await parseExcelFile(file);
        
        // Validate row count for Excel
        const rowValidation = validateUploadLimits(file, data);
        if (!rowValidation.isValid) {
          const errorMessage = rowValidation.error === 'tooManyRows' 
            ? `${t('tooManyRows')}: ${formatRowCount(rowValidation.actualRows!)} > ${formatRowCount(rowValidation.maxRows!)}`
            : t(rowValidation.error!);
          
          toast({
            title: t('error'),
            description: errorMessage,
            variant: 'destructive',
          });
          return { success: false, error: rowValidation.error };
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

      // Success message with security info
      let description = typeValidation.fileType === 'csv' 
        ? `CSV-Datei wurde hochgeladen: ${data.data ? data.data.length : data.totalRows || 0} Zeilen gefunden`
        : `Excel-Datei wurde hochgeladen: ${data.sheets.length} Arbeitsblätter gefunden`;
      
      if (sanitizedCount > 0) {
        description += `. ${t('sanitizedNotice')}: ${sanitizedCount} Formel(n) gesichert.`;
      }

      toast({
        title: 'Upload erfolgreich',
        description,
      });

      return { 
        success: true, 
        data, 
        fileName,
        fileType: typeValidation.fileType,
        sanitizedCount 
      };
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

  const parseCsvFile = async (file: File): Promise<{ data: Record<string, unknown>[], totalRows: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvContent = e.target?.result as string;
          
          // Simple CSV parsing - split by lines and then by separator
          const lines = csvContent.split('\n').filter(line => line.trim());
          if (lines.length === 0) {
            reject(new Error('Empty CSV file'));
            return;
          }
          
          // Detect separator (comma, semicolon, or tab)
          const firstLine = lines[0];
          let separator = ',';
          if (firstLine.includes(';') && firstLine.split(';').length > firstLine.split(',').length) {
            separator = ';';
          } else if (firstLine.includes('\t')) {
            separator = '\t';
          }
          
          // Parse header row
          const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
          
          // Parse data rows
          const data = lines.slice(1).map(line => {
            const values = line.split(separator).map(v => v.trim().replace(/"/g, ''));
            const record: Record<string, unknown> = {};
            
            headers.forEach((header, index) => {
              record[header] = values[index] || '';
            });
            
            return record;
          });
          
          resolve({
            data,
            totalRows: data.length
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
      reader.readAsText(file, 'utf-8');
    });
  };

  const parseExcelFile = (file: File): Promise<{ sheets: unknown[], totalSheets: number, totalRows: number }> => {
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
    parseExcelFile,
    parseCsvFile,
    getUploadedFiles,
    isUploading
  };
};