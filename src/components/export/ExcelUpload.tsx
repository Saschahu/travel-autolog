import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';
import { useExcelUpload } from '@/hooks/useExcelUpload';
import { useToast } from '@/hooks/use-toast';

export const ExcelUpload = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadExcelFile, isUploading } = useExcelUpload();
  const { toast } = useToast();

  const isXlsxEnabled = import.meta.env.VITE_ENABLE_XLSX === 'true';
  const acceptFormats = isXlsxEnabled ? '.xlsx,.xls,.csv' : '.csv';

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a valid file type
    const isCSV = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
    const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   file.type === 'application/vnd.ms-excel' ||
                   file.name.toLowerCase().endsWith('.xlsx') ||
                   file.name.toLowerCase().endsWith('.xls');

    if (!isCSV && !isExcel) {
      toast({
        title: 'Ungültiger Dateityp',
        description: isXlsxEnabled ? 
          'Bitte wählen Sie eine CSV, XLS oder XLSX-Datei.' : 
          'Bitte wählen Sie eine CSV-Datei.',
        variant: 'destructive',
      });
      return;
    }

    await uploadExcelFile(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          {isXlsxEnabled ? t('excelImport') : 'CSV Import'}
        </CardTitle>
        <CardDescription>
          {isXlsxEnabled ? 
            t('excelImportDescription') : 
            'Laden Sie CSV-Dateien hoch um Auftragsdaten zu importieren'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isXlsxEnabled && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              {t('xlsxDisabledCsvAvailable')}
            </p>
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptFormats}
          className="hidden"
        />
        
        <Button 
          onClick={handleFileSelect}
          disabled={isUploading}
          className="w-full"
          variant="outline"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Upload className="h-4 w-4 mr-2" />
          )}
          {isUploading ? t('uploading') : 
           (isXlsxEnabled ? t('selectExcelFile') : 'CSV-Datei auswählen')}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p>{isXlsxEnabled ? 'Unterstützte Formate: .xlsx, .xls, .csv' : 'Unterstützte Formate: .csv'}</p>
          <p>Maximale Dateigröße: {import.meta.env.VITE_MAX_UPLOAD_SIZE_MB || '5'} MB</p>
          <p>Maximale Zeilen: {(import.meta.env.VITE_MAX_UPLOAD_ROWS || '50000').toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
};