import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FolderOpen, Mail, Plus, TestTube, AlertCircle, Check, X, Info, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  pickDirectory,
  loadPersistedDirectory,
  persistDirectory,
  clearDirectorySelection,
  testWrite,
  checkDirectoryPermission,
  getDisplayName,
  getPermissionStatus,
  isFileSystemAccessSupported,
  isInCrossOriginFrame
} from '@/lib/fs/directoryPicker';
import {
  EMAIL_PROVIDERS,
  openCompose,
  getTestMessage,
  getProviderById
} from '@/lib/emailProviders';
import { isNativeAndroid } from '@/lib/platform';
import { Slider } from '@/components/ui/slider';
import { useSettingsStore } from '@/state/settingsStore';
import type { ExportFolderRef } from '@/lib/fs/directoryPicker';

interface ExportSettingsData {
  directoryHandle?: any;
  directoryName: string;
  preferredEmailProvider: string;
  exportDirUri?: string; // Android SAF URI (legacy)
}

interface ExportSettingsProps {
  settings: ExportSettingsData;
  onSettingsChange: (settings: ExportSettingsData) => void;
}

export const ExportSettings = ({ settings, onSettingsChange }: ExportSettingsProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { pdfQuality = 60, setPdfQuality, exportDirRef, setExportDirRef } = useSettingsStore();
  const [isPickingDirectory, setIsPickingDirectory] = useState(false);
  const [isTestingWrite, setIsTestingWrite] = useState(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);
  const [permissionValid, setPermissionValid] = useState<boolean | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  
  const isWebSupported = isFileSystemAccessSupported();
  const isAndroid = isNativeAndroid();
  const isCrossOrigin = isInCrossOriginFrame();

  // Load and validate directory state
  const reloadDirectory = useCallback(async () => {
    try {
      const ref = await loadPersistedDirectory();
      if (ref) {
        // Check permission
        const hasPermission = await checkDirectoryPermission(ref);
        setPermissionValid(hasPermission);
        
        if (hasPermission) {
          setExportDirRef(ref);
          await persistDirectory(ref); // Ensure it's persisted
        } else {
          // Permission lost, clear reference
          setExportDirRef(undefined);
          await clearDirectorySelection();
        }
      } else {
        setExportDirRef(undefined);
        setPermissionValid(null);
      }
    } catch (error) {
      console.error('Failed to reload directory state:', error);
      setExportDirRef(undefined);
      setPermissionValid(null);
    }
  }, [setExportDirRef]);

  // Load directory on mount and setup listeners
  useEffect(() => {
    reloadDirectory();

    // Listen for bridge selection via BroadcastChannel (web only)
    if (!isAndroid) {
      let bc: BroadcastChannel | null = null;
      try {
        bc = new BroadcastChannel('fs-bridge');
        bc.onmessage = (ev) => {
          if (ev.data?.type === 'fs:selected' && ev.data.key === 'exportDir') {
            reloadDirectory();
          }
        };
      } catch (error) {
        console.warn('BroadcastChannel not available:', error);
      }

      // Fallback: listen for focus events and check localStorage
      const onFocus = () => {
        const timestamp = localStorage.getItem('fs.exportDir.selectedAt');
        if (timestamp && Number(timestamp) > Date.now() - 30000) {
          localStorage.removeItem('fs.exportDir.selectedAt');
          reloadDirectory();
        }
      };
      window.addEventListener('focus', onFocus);

      return () => {
        if (bc) bc.close();
        window.removeEventListener('focus', onFocus);
      };
    }
  }, [reloadDirectory, isAndroid]);

  const handleDirectoryPick = async () => {
    setIsPickingDirectory(true);
    
    try {
      const result = await pickDirectory();
      
      if (result.success && result.ref) {
        setExportDirRef(result.ref);
        await persistDirectory(result.ref);
        setPermissionValid(true);
        
        toast({
          title: 'Ordner ausgewählt',
          description: `Exportpfad gesetzt: ${getDisplayName(result.ref)}`
        });
      } else if (result.error && !result.error.includes('cancelled')) {
        let friendlyMessage = result.error;
        
        if (result.error.includes('No user activation')) {
          friendlyMessage = 'Bitte klicken Sie den Button direkt an (keine automatischen Aktionen).';
        } else if (result.error.includes('not supported')) {
          friendlyMessage = 'Ihr Browser unterstützt die Ordnerauswahl nicht.';
        } else if (result.error.includes('Pop-up blocked')) {
          friendlyMessage = 'Pop-ups wurden blockiert. Bitte erlauben Sie Pop-ups und versuchen Sie es erneut.';
        }
        
        toast({
          variant: "destructive",
          title: "Ordnerauswahl fehlgeschlagen",
          description: friendlyMessage,
        });
      }
    } catch (error) {
      console.error('Directory picker error:', error);
      toast({
        variant: "destructive",
        title: "Fehler bei Ordnerauswahl",
        description: "Ein unbekannter Fehler ist aufgetreten.",
      });
    } finally {
      setIsPickingDirectory(false);
    }
  };

  const handleDirectoryPickInNewTab = () => {
    const bridgeUrl = `${window.location.origin}/bridge/directory-picker`;
    const newTab = window.open(bridgeUrl, '_blank', 'noopener,noreferrer');
    
    if (!newTab) {
      toast({
        variant: "destructive",
        title: "Pop-up blockiert",
        description: "Bitte erlauben Sie Pop-ups für diese Seite und versuchen Sie es erneut.",
      });
    } else {
      toast({
        title: "Neuer Tab geöffnet",
        description: "Bitte klicken Sie dort auf 'Ordnerauswahl starten'.",
      });
    }
  };

  const handleTestWrite = async () => {
    if (!exportDirRef) return;
    
    setIsTestingWrite(true);
    try {
      const result = await testWrite(exportDirRef);
      
      if (result.success) {
        toast({
          title: 'Testschreibung erfolgreich',
          description: `Datei "${result.fileName}" wurde erfolgreich erstellt.`
        });
      } else {
        toast({
          variant: "destructive",
          title: 'Testschreibung fehlgeschlagen',
          description: result.error || 'Unbekannter Fehler beim Schreiben der Testdatei'
        });
      }
    } catch (error) {
      console.error('Test write error:', error);
      toast({
        variant: "destructive",
        title: 'Testschreibung fehlgeschlagen',
        description: 'Ein unbekannter Fehler ist aufgetreten.'
      });
    } finally {
      setIsTestingWrite(false);
    }
  };

  const handleCheckPermission = async () => {
    if (!exportDirRef) return;
    
    setIsCheckingPermission(true);
    try {
      const hasPermission = await checkDirectoryPermission(exportDirRef);
      setPermissionValid(hasPermission);
      
      if (hasPermission) {
        toast({
          title: 'Berechtigung gültig',
          description: 'Zugriff auf den Ordner ist weiterhin erlaubt.'
        });
      } else {
        toast({
          title: 'Berechtigung verloren',
          description: 'Zugriff auf den Ordner wurde entzogen. Bitte wählen Sie den Ordner erneut.',
          variant: 'destructive'
        });
        // Clear the invalid reference
        setExportDirRef(undefined);
        await clearDirectorySelection();
      }
    } catch (error) {
      console.error('Permission check error:', error);
      toast({
        variant: "destructive",
        title: 'Fehler bei Berechtigungsprüfung',
        description: 'Berechtigungsstatus konnte nicht überprüft werden.'
      });
    } finally {
      setIsCheckingPermission(false);
    }
  };

  const handleClearSelection = async () => {
    setExportDirRef(undefined);
    await clearDirectorySelection();
    setPermissionValid(null);
    
    toast({
      title: 'Auswahl gelöscht',
      description: 'Ordnerauswahl wurde entfernt.'
    });
  };

  const handleEmailTest = async () => {
    setIsTesting(true);
    try {
      const testMessage = getTestMessage();
      const success = await openCompose(settings.preferredEmailProvider, testMessage);
      
      if (success) {
        toast({
          title: 'E-Mail-App geöffnet',
          description: 'Compose-Fenster wurde erfolgreich geöffnet'
        });
      } else {
        toast({
          title: 'Popup blockiert',
          description: 'Bitte erlauben Sie Popups für diese Seite und versuchen Sie es erneut',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Email test error:', error);
      toast({
        title: 'Fehler beim Öffnen der E-Mail-App',
        description: 'E-Mail-App konnte nicht geöffnet werden',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const selectedProvider = getProviderById(settings.preferredEmailProvider);

  return (
    <div className="space-y-6">
      {/* Directory Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="h-4 w-4 text-primary" />
            {t('localStoragePath')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isWebSupported && !isAndroid ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ihr Browser unterstützt die Ordner-Auswahl nicht. Es wird der Standard-Download-Ordner verwendet.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="mb-4">
                <Label>{t('selectedFolder')}</Label>
                <div className="mt-2 p-3 rounded-lg border bg-background">
                  {exportDirRef ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {getDisplayName(exportDirRef)}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>
                            {getPermissionStatus(exportDirRef)}
                            {permissionValid === false && ' (verloren)'}
                          </span>
                          {permissionValid === false && (
                            <Badge variant="destructive" className="text-xs">
                              {t('permissionLost')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {permissionValid === false && (
                          <Button
                            onClick={handleCheckPermission}
                            disabled={isCheckingPermission}
                            variant="outline"
                            size="sm"
                          >
                            {isCheckingPermission ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        <Button
                          onClick={handleTestWrite}
                          disabled={isTestingWrite || !exportDirRef || permissionValid === false}
                          variant="secondary"
                          size="sm"
                        >
                          {isTestingWrite ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Test...
                            </>
                          ) : (
                            <>
                              <TestTube className="mr-1 h-3 w-3" />
                              {t('testWrite')}
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleClearSelection}
                          variant="outline"
                          size="sm"
                        >
                          {t('clearSelection')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {t('noFolderSelected')}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleDirectoryPick}
                    disabled={isPickingDirectory}
                    variant="outline"
                  >
                    {isPickingDirectory ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('selectingFolder')}
                      </>
                    ) : (
                      <>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {isAndroid ? `${t('selectFolder')} (Android)` : t('selectFolder')}
                      </>
                    )}
                  </Button>
                  {isCrossOrigin && !isAndroid && (
                    <Button
                      onClick={handleDirectoryPickInNewTab}
                      variant="secondary"
                      size="sm"
                    >
                      {t('selectInNewTab')}
                    </Button>
                  )}
                </div>
              </div>
              
              {isCrossOrigin && !isAndroid && (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Ordnerauswahl im eingebetteten Fenster nicht möglich. 
                    Verwenden Sie "In neuem Tab wählen" oder "Ordner wählen" (öffnet neuen Tab).
                  </AlertDescription>
                </Alert>
              )}
              
              {isAndroid && !exportDirRef && (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Wählen Sie einen Ordner für den Export. Die App verwendet den Android Storage Access Framework (SAF) für sicheren Dateizugriff.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground">
            {isWebSupported || isAndroid
              ? "Wenn kein Ordner gewählt ist, wird der Standard-Download-Ordner verwendet."
              : "Excel-Dateien werden in Ihrem Standard-Download-Ordner gespeichert."
            }
          </p>
        </CardContent>
      </Card>

      {/* PDF Quality Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" />
            {t('pdfSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="pdf-quality">{t('pdfQuality')}</Label>
              <span className="text-sm font-medium">{pdfQuality}%</span>
            </div>
            <Slider
              id="pdf-quality"
              min={50}
              max={80}
              step={5}
              value={[pdfQuality]}
              onValueChange={([value]) => setPdfQuality(value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Höhere Qualität = größere Dateien. 60% ist ein guter Kompromiss zwischen Qualität und Dateigröße.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-primary" />
            {t('preferredEmailApp')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-provider">{t('selectEmailProvider')}</Label>
            <Select
              value={settings.preferredEmailProvider}
              onValueChange={(value) => 
                onSettingsChange({ ...settings, preferredEmailProvider: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Option wählen" />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      <span>{provider.icon}</span>
                      <div className="flex flex-col">
                        <span>{provider.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {provider.description}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProvider && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span>{selectedProvider.icon}</span>
                <div>
                  <p className="font-medium text-sm">{selectedProvider.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedProvider.description}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleEmailTest}
                disabled={isTesting}
                variant="outline"
                size="sm"
              >
                <TestTube className="h-4 w-4 mr-2" />
                {isTesting ? t('testing') : t('test')}
              </Button>
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t('emailClientLimitation')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
