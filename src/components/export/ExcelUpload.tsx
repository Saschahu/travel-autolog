import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, Loader2, AlertTriangle } from 'lucide-react';
import { useExcelUpload } from '@/hooks/useExcelUpload';
import { isXlsxEnabled } from '@/lib/flags';

export const ExcelUpload = () => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadExcelFile, isUploading } = useExcelUpload();
  const xlsxEnabled = isXlsxEnabled();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
        {!xlsxEnabled && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('xlsxDisabledCsvAvailable')}
            </AlertDescription>
          </Alert>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={xlsxEnabled ? ".xlsx,.xls,.csv" : ".csv"}
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
          <p>{xlsxEnabled ? t('supportedFormatsAll') : t('supportedFormatsCsvOnly')}</p>
          <p>{t('maxFileSize')}</p>
        </div>
      </CardContent>
    </Card>
  );
};