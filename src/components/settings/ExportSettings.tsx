import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FolderOpen, Mail, Plus, TestTube, AlertCircle, Check, X, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  isFileSystemAccessSupported,
  isInCrossOriginFrame,
  pickDirectoryDirect,
  openDirectoryPickerBridge,
  waitForBridgeSelection,
  createSubdirectory,
  queryPermission,
  requestPermission,
  computeDisplayName
} from '@/lib/fsAccess';
import { loadExportHandle, loadExportMeta, saveExportHandle, clearExportHandle } from '@/lib/fsStore';
import {
  EMAIL_PROVIDERS,
  openCompose,
  getTestMessage,
  getProviderById
} from '@/lib/emailProviders';
import { DirectoryPicker } from '@/plugins/directoryPicker';
import { isNativeAndroid } from '@/lib/platform';

interface ExportSettingsData {
  directoryHandle?: any;
  directoryName: string;
  preferredEmailProvider: string;
  exportDirUri?: string; // Android SAF URI
}

interface ExportSettingsProps {
  settings: ExportSettingsData;
  onSettingsChange: (settings: ExportSettingsData) => void;
}

export const ExportSettings = ({ settings, onSettingsChange }: ExportSettingsProps) => {
  const { toast } = useToast();
  const [isPickingDirectory, setIsPickingDirectory] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [folderName, setFolderName] = useState('ServiceTracker');
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  const [hasHandle, setHasHandle] = useState(false);
  
  const isSupported = isFileSystemAccessSupported();

  // Reload folder state from storage
  const reload = useCallback(async () => {
    try {
      const [handle, meta] = await Promise.all([loadExportHandle(), loadExportMeta()]);
      if (handle) {
        setHasHandle(true);
        const permission = await queryPermission(handle);
        setPermissionStatus(permission);
        const name = computeDisplayName(handle, meta || undefined);
        setDisplayName(name);
        
        onSettingsChange({
          ...settings,
          directoryHandle: handle,
          directoryName: name
        });
      } else {
        setHasHandle(false);
        setPermissionStatus(null);
        setDisplayName(null);
        onSettingsChange({
          ...settings,
          directoryHandle: undefined,
          directoryName: ''
        });
      }
    } catch (error) {
      console.error('Failed to reload folder state:', error);
      setHasHandle(false);
      setPermissionStatus(null);
      setDisplayName(null);
    }
  }, [settings, onSettingsChange]);

  // Load persisted directory handle on mount and setup listeners
  useEffect(() => {
    if (isSupported) {
      reload();
    }

    // Listen for bridge selection via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('fs-bridge');
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'fs:selected' && ev.data.key === 'exportDir') {
          reload();
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
        reload();
      }
    };
    window.addEventListener('focus', onFocus);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('focus', onFocus);
    };
  }, [isSupported, reload]);

  const handleDirectoryPick = async () => {
    setIsPickingDirectory(true);
    
    try {
      if (isNativeAndroid()) {
        // Android SAF picker
        const { uri } = await DirectoryPicker.pickDirectory();
        
        // Save URI to settings
        onSettingsChange({
          ...settings,
          exportDirUri: uri,
          directoryName: 'Android Ordner'
        });
        
        toast({
          title: 'Ordner ausgewählt',
          description: 'Android Ordner wurde erfolgreich ausgewählt'
        });
        
        setIsPickingDirectory(false);
        return;
      }
    } catch (error: any) {
      if (String(error).includes('USER_CANCELLED')) {
        setIsPickingDirectory(false);
        return;
      }
      
      toast({
        variant: "destructive",
        title: "Android Ordnerauswahl fehlgeschlagen",
        description: "Bitte versuchen Sie es erneut.",
      });
      
      setIsPickingDirectory(false);
      return;
    }
    
    if (!isSupported) {
      setIsPickingDirectory(false);
      return;
    }
    
    // Web: Try direct picker first (if not in cross-origin iframe)
    if (isFileSystemAccessSupported() && !isInCrossOriginFrame()) {
      try {
        const handle = await pickDirectoryDirect();
        
        if (handle) {
          await reload(); // Reload state after successful selection
          
          toast({
            title: 'Ordner ausgewählt',
            description: `Exportpfad gesetzt: ${computeDisplayName(handle)}`
          });
          
          setIsPickingDirectory(false);
          return;
        }
      } catch (error) {
        console.error('Directory picker error:', error);
        const message = error instanceof Error ? error.message : 'Ordnerauswahl fehlgeschlagen';
        
        // Handle specific error cases
        let friendlyMessage = message;
        if (message.includes('No user activation')) {
          friendlyMessage = 'Bitte klicken Sie den Button direkt an (keine automatischen Aktionen).';
        } else if (message.includes('not supported')) {
          friendlyMessage = 'Ihr Browser unterstützt die Ordnerauswahl nicht.';
        } else if (message.includes('denied')) {
          friendlyMessage = 'Berechtigung verweigert. Bitte versuchen Sie es erneut.';
        }
        
        toast({
          variant: "destructive",
          title: "Ordnerauswahl nicht möglich",
          description: friendlyMessage,
        });
        
        setIsPickingDirectory(false);
        return;
      }
    }
    
    // Bridge flow: open new tab and wait for selection
    try {
      const opened = openDirectoryPickerBridge();
      
      if (!opened) {
        toast({
          variant: "destructive",
          title: "Pop-up blockiert",
          description: "Bitte erlauben Sie Pop-ups für diese Seite und versuchen Sie es erneut.",
        });
        setIsPickingDirectory(false);
        return;
      }
      
      toast({
        title: "Neuer Tab geöffnet",
        description: "Bitte klicken Sie dort auf 'Ordnerauswahl starten'.",
      });
      
      // Don't wait here - let the BroadcastChannel/focus listeners handle it
    } catch (error) {
      console.error('Bridge selection error:', error);
      toast({
        variant: "destructive",
        title: "Ordnerauswahl fehlgeschlagen",
        description: "Bitte versuchen Sie es erneut.",
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
    }
  };

  const handleCreateSubfolder = async () => {
    if (!settings.directoryHandle || !folderName.trim()) return;
    
    setIsCreatingFolder(true);
    try {
      const subHandle = await createSubdirectory(settings.directoryHandle, folderName.trim());
      const parentName = displayName || settings.directoryHandle.name || 'Ausgewählter Ordner';
      const newDisplayName = `${parentName}/${folderName.trim()}`;
      
      await saveExportHandle(subHandle, { 
        displayName: newDisplayName,
        createdByApp: true 
      });
      
      await reload(); // Reload state after creating subfolder
      
      toast({
        title: 'Unterordner erstellt',
        description: `Neuer Exportpfad: ${newDisplayName}`
      });
    } catch (error) {
      console.error('Failed to create subdirectory:', error);
      toast({
        title: 'Fehler beim Erstellen des Unterordners',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleRequestPermission = async () => {
    if (!settings.directoryHandle) return;
    
    const granted = await requestPermission(settings.directoryHandle);
    if (granted) {
      await reload();
      toast({
        title: 'Berechtigung erteilt',
        description: 'Zugriff auf den Ordner wurde wieder erlaubt.'
      });
    } else {
      toast({
        title: 'Berechtigung verweigert',
        description: 'Zugriff auf den Ordner wurde nicht erlaubt.',
        variant: 'destructive'
      });
    }
  };

  const handleClearSelection = async () => {
    await clearExportHandle();
    await reload();
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
            Lokaler Speicherpfad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported && !isNativeAndroid() ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {isNativeAndroid() 
                  ? "Nutzen Sie den Android Ordner-Picker für bessere Funktionalität."
                  : "Ihr Browser unterstützt die Ordner-Auswahl nicht. Es wird der Standard-Download-Ordner verwendet."
                }
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="mb-4">
                <Label>Gewählter Ordner</Label>
                <div className="mt-2 p-3 rounded-lg border bg-background">
                  {(hasHandle && displayName) || settings.exportDirUri ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {isNativeAndroid() && settings.exportDirUri 
                            ? settings.directoryName || 'Android Ordner'
                            : displayName
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isNativeAndroid() && settings.exportDirUri ? (
                            'Android SAF Berechtigung: erteilt'
                          ) : (
                            `Berechtigung: ${
                              permissionStatus === 'granted' 
                                ? 'erteilt' 
                                : permissionStatus === 'denied' 
                                  ? 'verweigert' 
                                  : 'ausstehend'
                            }`
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {permissionStatus !== 'granted' && (
                          <Button
                            onClick={handleRequestPermission}
                            variant="outline"
                            size="sm"
                          >
                            Zugriff erlauben
                          </Button>
                        )}
                        <Button
                          onClick={() => {
                            if (isNativeAndroid() && settings.exportDirUri) {
                              onSettingsChange({
                                ...settings,
                                exportDirUri: undefined,
                                directoryName: ''
                              });
                              toast({
                                title: 'Android Ordner entfernt',
                                description: 'Ordnerauswahl wurde zurückgesetzt.'
                              });
                            } else {
                              handleClearSelection();
                            }
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Auswahl löschen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Kein Ordner ausgewählt
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
                        Wähle Ordner...
                      </>
                    ) : (
                      <>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {isNativeAndroid() ? 'Ordner wählen (Android)' : 'Ordner wählen'}
                      </>
                    )}
                  </Button>
                  {isInCrossOriginFrame() && (
                    <Button
                      onClick={handleDirectoryPickInNewTab}
                      variant="secondary"
                      size="sm"
                    >
                      In neuem Tab wählen
                    </Button>
                  )}
                </div>
              </div>
              
              {isInCrossOriginFrame() && (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Ordnerauswahl im eingebetteten Fenster nicht möglich. 
                    Klicken Sie "Ordner wählen", es öffnet sich ein neuer Tab. 
                    Dort auf "Ordnerauswahl starten" klicken.
                  </AlertDescription>
                </Alert>
              )}

              {hasHandle && permissionStatus === 'granted' && (
                <div className="space-y-3 pt-3 border-t">
                  <Label htmlFor="folder-name">Neuen Unterordner anlegen</Label>
                  <div className="flex gap-2">
                    <Input
                      id="folder-name"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      placeholder="Ordnername (z.B. ServiceTracker)"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleCreateSubfolder}
                      disabled={isCreatingFolder || !folderName.trim()}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {isCreatingFolder ? 'Erstelle...' : 'Erstellen'}
                    </Button>
                  </div>
                </div>
              )}

              {permissionStatus === 'denied' && hasHandle && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Zugriff auf den gewählten Ordner wurde verweigert oder ist abgelaufen. 
                    Bitte wählen Sie den Ordner erneut aus.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          <p className="text-xs text-muted-foreground">
            {isSupported 
              ? "Wenn kein Ordner gewählt ist, wird der Standard-Download-Ordner verwendet."
              : "Excel-Dateien werden in Ihrem Standard-Download-Ordner gespeichert."
            }
          </p>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-primary" />
            Bevorzugte E-Mail-Anwendung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-provider">E-Mail-Provider auswählen</Label>
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
                {isTesting ? 'Teste...' : 'Testen'}
              </Button>
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Installierte Desktop-Programme können im Browser nicht automatisch erkannt werden. 
              Die Auswahl öffnet Web-basierte E-Mail-Clients oder das System-Standard-Programm.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};