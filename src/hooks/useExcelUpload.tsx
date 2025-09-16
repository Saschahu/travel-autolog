import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isXlsxEnabled } from '@/lib/flags';

export const useExcelUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const uploadExcelFile = async (file: File) => {
    setIsUploading(true);
    try {
      // Check file type and XLSX flag
      const isXlsxFile = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                        file.type === 'application/vnd.ms-excel' ||
                        file.name.toLowerCase().endsWith('.xlsx') ||
                        file.name.toLowerCase().endsWith('.xls');
      
      const isCsvFile = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');

      // Block XLSX/XLS files when flag is OFF
      if (isXlsxFile && !isXlsxEnabled()) {
        toast({
          title: t('xlsxBlocked'),
          description: t('xlsxDisabledCsvAvailable'),
          variant: 'destructive',
        });
        return { success: false, error: 'XLSX blocked by feature flag' };
      }

      // Allow CSV files always
      if (!isCsvFile && !isXlsxFile) {
        toast({
          title: t('error'),
          description: t('pleaseSelectExcelFile'),
          variant: 'destructive',
        });
        return { success: false, error: 'Invalid file type' };
      }

      // Parse Excel file
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
        title: t('success'),
        description: `${t('excelImport')}: ${data.sheets.length} ${t('sheetsFound')}`,
      });

      return { success: true, data, fileName };
    } catch (error) {
      console.error('Excel upload error:', error);
      toast({
        title: t('error'),
        description: t('uploadError'),
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setIsUploading(false);
    }
  };

  const parseExcelFile = (file: File): Promise<{
    sheets: Array<{
      name: string;
      data: unknown[];
      rowCount: number;
    }>;
    totalSheets: number;
    totalRows: number;
  }> => {
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

      reader.onerror = () => reject(new Error(t('fileReadError')));
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