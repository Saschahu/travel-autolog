import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

    // Define allowed types based on feature flag
    const csvTypes = ['text/csv', 'application/csv'];
    const xlsxTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    const allowedTypes = xlsxEnabled ? [...csvTypes, ...xlsxTypes] : csvTypes;

    // Check file type by extension as well (MIME types can be unreliable)
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isCSV = fileExtension === 'csv' || csvTypes.includes(file.type);
    const isXLSX = fileExtension === 'xlsx' || fileExtension === 'xls' || xlsxTypes.includes(file.type);
    
    if (!isCSV && !isXLSX) {
      alert(t('pleaseSelectExcelFile'));
      return;
    }
    
    if (isXLSX && !xlsxEnabled) {
      alert(t('xlsxBlocked'));
      return;
    }
    
    if (!allowedTypes.includes(file.type) && !isCSV && !(isXLSX && xlsxEnabled)) {
      alert(t('pleaseSelectExcelFile'));
      return;
    }

    await uploadExcelFile(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Dynamic accept attribute
  const acceptAttribute = xlsxEnabled ? '.xlsx,.xls,.csv' : '.csv';
  
  // Dynamic supported formats text
  const supportedFormatsKey = xlsxEnabled ? 'supportedFormatsAll' : 'supportedFormatsCsvOnly';

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
        {/* Warning banner when XLSX is disabled */}
        {!xlsxEnabled && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              {t('xlsxDisabledCsvAvailable')}
            </div>
          </div>
        )}
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptAttribute}
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
          <p>{t(supportedFormatsKey)}</p>
          <p>{t('maxFileSize')}</p>
        </div>
      </CardContent>
    </Card>
  );
};