import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useExcelUpload } from '@/hooks/useExcelUpload';

export const ExcelUpload = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadExcelFile, isUploading } = useExcelUpload();
  
  // Check if XLSX is enabled via environment variable
  const ENABLE_XLSX = import.meta.env.VITE_ENABLE_XLSX !== 'false';

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (ENABLE_XLSX) {
      // Check if it's an Excel file
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];

      if (!allowedTypes.includes(file.type)) {
        alert(t('pleaseSelectExcelFile'));
        return;
      }
    } else {
      // Check if it's a CSV file when XLSX is disabled
      const allowedTypes = ['text/csv', 'application/csv'];
      
      if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
        alert(t('csvInvalid'));
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
          {ENABLE_XLSX ? t('excelImportDescription') : t('excelImportDisabledCsvFallback')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={ENABLE_XLSX ? ".xlsx,.xls" : ".csv"}
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
          {isUploading ? t('uploading') : (ENABLE_XLSX ? t('selectExcelFile') : t('selectCsvFile'))}
        </Button>

        <div className="text-sm text-muted-foreground">
          <p>{ENABLE_XLSX ? t('supportedFormats') : t('supportedCsvFormats')}</p>
          <p>{t('maxFileSize')}</p>
        </div>
      </CardContent>
    </Card>
  );
};