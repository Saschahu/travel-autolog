import { readWorkbook } from '@/lib/excelAdapter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export const useExcelUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const uploadExcelFile = async (file: File) => {
    setIsUploading(true);
    try {
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
      const workbook = await readWorkbook(file);
      
      const sheets = workbook.sheets.map(sheet => ({
        name: sheet.name,
        data: sheet.rows.map(row => {
          // Convert rows to object format for backward compatibility
          const obj: any = {};
          row.forEach((cell, index) => {
            obj[`col_${index}`] = cell;
          });
          return obj;
        }),
        rowCount: sheet.rows.length
      }));

      return {
        sheets,
        totalSheets: sheets.length,
        totalRows: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0)
      };
    } catch (error) {
      throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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