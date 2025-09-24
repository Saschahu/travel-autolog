import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Download, 
  Trash2, 
  AlertTriangle,
  Info,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { PrivacySummary } from './PrivacySummary';
import { 
  getConsentStatus, 
  setConsentStatus, 
  type ConsentStatus 
} from '@/lib/privacy/consentStorage';
import { setTelemetryEnabled, isTelemetryEnabled } from '@/boot/monitoring';
import { 
  exportLocalData, 
  downloadExportedData, 
  deleteLocalData, 
  getDataSummary 
} from '@/privacy/dataPortability';

/**
 * Privacy settings component for the settings page
 */
export const PrivacySettings = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [consentStatus, setConsentStatusState] = useState<ConsentStatus>('unset');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dataSummary, setDataSummary] = useState({
    indexedDbKeys: 0,
    localStorageKeys: 0,
    capacitorPreferences: 0
  });

  // Load current consent status
  useEffect(() => {
    loadConsentStatus();
    loadDataSummary();
  }, []);

  const loadConsentStatus = async () => {
    try {
      const status = await getConsentStatus();
      setConsentStatusState(status);
    } catch (error) {
      console.error('Failed to load consent status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataSummary = async () => {
    try {
      const summary = await getDataSummary();
      setDataSummary(summary);
    } catch (error) {
      console.error('Failed to load data summary:', error);
    }
  };

  const handleTelemetryToggle = async (enabled: boolean) => {
    try {
      const newStatus = enabled ? 'accepted' : 'declined';
      await setConsentStatus(newStatus);
      setConsentStatusState(newStatus);
      
      // Update runtime monitoring
      setTelemetryEnabled(enabled);
      
      toast({
        title: t('privacy.settingsUpdated'),
        description: enabled 
          ? t('privacy.telemetryEnabled') 
          : t('privacy.telemetryDisabled'),
      });
      
    } catch (error) {
      console.error('Failed to update telemetry setting:', error);
      toast({
        title: t('privacy.error'),
        description: t('privacy.failedToUpdateSettings'),
        variant: 'destructive',
      });
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    
    try {
      const dataBlob = await exportLocalData();
      downloadExportedData(dataBlob);
      
      toast({
        title: t('privacy.exportSuccess'),
        description: t('privacy.exportSuccessDescription'),
      });
      
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: t('privacy.exportError'),
        description: t('privacy.exportErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    setIsDeleting(true);
    
    try {
      await deleteLocalData();
      
      toast({
        title: t('privacy.deleteSuccess'),
        description: t('privacy.deleteSuccessDescription'),
      });
      
      // Reload the page after successful deletion
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        title: t('privacy.deleteError'),
        description: t('privacy.deleteErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isTelemetryOn = consentStatus === 'accepted';

  return (
    <div className="space-y-6">
      {/* Telemetry Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            {t('privacy.telemetrySettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="telemetry-toggle" className="text-sm font-medium">
                {t('privacy.telemetryToggleLabel')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('privacy.telemetryToggleDescription')}
              </p>
            </div>
            <Switch
              id="telemetry-toggle"
              checked={isTelemetryOn}
              onCheckedChange={handleTelemetryToggle}
              disabled={isLoading}
              aria-label={t('privacy.telemetryToggleLabel')}
            />
          </div>
          
          {consentStatus === 'unset' && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('privacy.consentNotSet')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Privacy Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('privacy.privacyInformation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PrivacySummary variant="full" />
        </CardContent>
      </Card>

      {/* Data Export & Delete */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('privacy.dataManagement')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>{t('privacy.dataManagementDescription')}</p>
            <div className="text-xs">
              <p>{t('privacy.currentDataSummary')}:</p>
              <ul className="list-disc list-inside ml-2 mt-1">
                <li>{t('privacy.indexedDbEntries', { count: dataSummary.indexedDbKeys })}</li>
                <li>{t('privacy.localStorageEntries', { count: dataSummary.localStorageKeys })}</li>
                <li>{t('privacy.preferenceEntries', { count: dataSummary.capacitorPreferences })}</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              variant="outline"
              className="flex-1"
              aria-label={t('privacy.exportMyData')}
            >
              {isExporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isExporting ? t('privacy.exporting') : t('privacy.exportMyData')}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="flex-1"
                  disabled={isDeleting}
                  aria-label={t('privacy.deleteMyData')}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {isDeleting ? t('privacy.deleting') : t('privacy.deleteMyData')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {t('privacy.confirmDelete')}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>{t('privacy.deleteWarning')}</p>
                    <p className="text-sm font-medium">{t('privacy.deleteWarningList')}:</p>
                    <ul className="text-sm list-disc list-inside ml-2 space-y-1">
                      <li>{t('privacy.deleteItem1')}</li>
                      <li>{t('privacy.deleteItem2')}</li>
                      <li>{t('privacy.deleteItem3')}</li>
                      <li>{t('privacy.deleteItem4')}</li>
                    </ul>
                    <p className="text-sm font-medium text-destructive">
                      {t('privacy.deleteIrreversible')}
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('privacy.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('privacy.confirmDeleteButton')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};