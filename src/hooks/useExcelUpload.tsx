import * as XLSX from 'xlsx';
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
      // Guard: Block XLSX/XLS files when flag is false
      const isXlsxFile = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                         file.type === 'application/vnd.ms-excel' ||
                         file.name.toLowerCase().endsWith('.xlsx') ||
                         file.name.toLowerCase().endsWith('.xls');
      
      if (isXlsxFile && !isXlsxEnabled()) {
        toast({
          title: 'XLSX gesperrt',
          description: 'XLSX-Dateien sind nicht erlaubt wenn XLSX-Import deaktiviert ist.',
          variant: 'destructive',
        });
        return { success: false, error: 'XLSX blocked by feature flag' };
      }

      // Parse file (Excel or CSV)
      const data = await parseFile(file);
      
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
        description: `Datei wurde hochgeladen: ${data.sheets ? data.sheets.length : 1} Arbeitsblatt(er) gefunden`,
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

  const parseFile = (file: File): Promise<{
    sheets: Array<{
      name: string;
      data: Record<string, unknown>[];
      rowCount: number;
    }>;
    totalSheets: number;
    totalRows: number;
  }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
            // Parse CSV file  
            const text = e.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0]?.split(',') || [];
            const data = lines.slice(1).filter(line => line.trim()).map(line => {
              const values = line.split(',');
              const row: Record<string, unknown> = {};
              headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim() || '';
              });
              return row;
            });
            
            resolve({
              sheets: [{
                name: 'Sheet1',
                data,
                rowCount: data.length
              }],
              totalSheets: 1,
              totalRows: data.length
            });
          } else {
            // Parse Excel file
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
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
      
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  // Keep backwards compatibility
  const parseExcelFile = parseFile;

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