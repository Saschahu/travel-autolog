import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useExcelUpload } from '@/hooks/useExcelUpload';

export const ExcelUpload = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadExcelFile, isUploading, ENABLE_XLSX } = useExcelUpload();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type based on ENABLE_XLSX flag
    if (ENABLE_XLSX) {
      // XLSX enabled: accept both Excel and CSV files
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv'
      ];
      const allowedExtensions = ['.xlsx', '.xls', '.csv'];
      
      const hasValidType = allowedTypes.includes(file.type) || 
                          allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!hasValidType) {
        alert(t('pleaseSelectExcelFile'));
        return;
      }
    } else {
      // XLSX disabled: only accept CSV files
      const isCsv = file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv');
      
      if (!isCsv) {
        alert('Bitte wählen Sie eine CSV-Datei aus.');
        return;
      }
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
          {t('excelImport')}
        </CardTitle>
        <CardDescription>
          {t('excelImportDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={ENABLE_XLSX ? '.xlsx,.xls,.csv' : '.csv'}
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
          {isUploading ? t('uploading') : t('selectExcelFile')}
        </Button>

        <div className="text-sm text-muted-foreground">
          {!ENABLE_XLSX && (
            <p className="text-amber-600 mb-2">
              Excel-Import deaktiviert, CSV-Import verfügbar.
            </p>
          )}
          <p>{t('supportedFormats')}</p>
          <p>{t('maxFileSize')}</p>
        </div>
      </CardContent>
    </Card>
  );
};