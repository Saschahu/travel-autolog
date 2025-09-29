// @ts-nocheck
import { readWorkbook } from '@/lib/excelAdapter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { isXlsxEnabled } from '@/lib/flags';

export const useExcelUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadExcelFile = async (file: File) => {
    setIsUploading(true);
    try {
      // Get file extension for validation
      const fileExtension = file.name.toLowerCase().split('.').pop() || '';
      
      // Block XLSX/XLS files if flag is disabled (CSV remains allowed)
      if (['xlsx', 'xls'].includes(fileExtension) && !isXlsxEnabled()) {
        toast({
          title: 'Upload Fehler',
          description: 'XLSX-Import ist deaktiviert. Nur CSV-Dateien sind erlaubt.',
          variant: 'destructive',
        });
        return { success: false, error: 'XLSX disabled' };
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

  const parseExcelFile = async (file: File): Promise<any> => {
    try {
      const rows = await readWorkbook(file);
      
      // Convert to sheets format to maintain compatibility
      const sheets = [{
        name: 'Sheet1',
        data: rows,
        rowCount: rows.length
      }];

      return {
        sheets,
        totalSheets: sheets.length,
        totalRows: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0)
      };
    } catch (error) {
      throw new Error('Datei konnte nicht gelesen werden');
    }
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