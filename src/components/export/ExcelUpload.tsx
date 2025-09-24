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

    // Get file extension
    const fileExtension = file.name.toLowerCase().split('.').pop() || '';
    
    // Check if it's a CSV file (always allowed)
    if (fileExtension === 'csv') {
      await uploadExcelFile(file);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Check if it's an XLSX/XLS file and if XLSX is enabled
    const excelExtensions = ['xlsx', 'xls'];
    if (excelExtensions.includes(fileExtension)) {
      if (!xlsxEnabled) {
        alert(t('import.xlsxDisabledCsvAvailable'));
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // XLSX is enabled, proceed with upload
      await uploadExcelFile(file);
    } else {
      // File type not supported
      alert(t('pleaseSelectExcelFile'));
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Dynamic accept attribute based on flag
  const acceptAttribute = xlsxEnabled ? '.xlsx,.xls,.csv' : '.csv';
  
  // Dynamic supported formats message
  const supportedFormatsKey = xlsxEnabled ? 'import.supportedFormatsWithoutFlag' : 'import.supportedFormatsWithFlag';

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
        {/* Warning message when XLSX is disabled */}
        {!xlsxEnabled && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm">{t('import.xlsxDisabledCsvAvailable')}</p>
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