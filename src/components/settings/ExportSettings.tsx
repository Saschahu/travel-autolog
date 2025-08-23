import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FolderOpen, Mail, Plus, TestTube, AlertCircle, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  isFileSystemAccessSupported,
  pickDirectory,
  persistHandle,
  loadHandle,
  ensurePermission,
  createSubdirectory,
  getDirectoryName
} from '@/lib/fsAccess';
import {
  EMAIL_PROVIDERS,
  openCompose,
  getTestMessage,
  getProviderById
} from '@/lib/emailProviders';

interface ExportSettingsData {
  directoryHandle?: any;
  directoryName: string;
  preferredEmailProvider: string;
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
  const [folderName, setFolderName] = useState('ServiTracker');
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'checking'>('checking');
  
  const isSupported = isFileSystemAccessSupported();

  // Load persisted directory handle on mount
  useEffect(() => {
    const loadPersistedHandle = async () => {
      try {
        const handle = await loadHandle();
        if (handle) {
          const hasPermission = await ensurePermission(handle);
          if (hasPermission) {
            const name = await getDirectoryName(handle);
            onSettingsChange({
              ...settings,
              directoryHandle: handle,
              directoryName: name
            });
            setPermissionStatus('granted');
          } else {
            setPermissionStatus('denied');
          }
        } else {
          setPermissionStatus('denied');
        }
      } catch (error) {
        console.error('Failed to load persisted handle:', error);
        setPermissionStatus('denied');
      }
    };

    if (isSupported) {
      loadPersistedHandle();
    }
  }, [isSupported]);

  const handleDirectoryPick = async () => {
    if (!isSupported) return;
    
    setIsPickingDirectory(true);
    try {
      const handle = await pickDirectory();
      if (handle) {
        await persistHandle(handle);
        const name = await getDirectoryName(handle);
        
        onSettingsChange({
          ...settings,
          directoryHandle: handle,
          directoryName: name
        });
        
        setPermissionStatus('granted');
        
        toast({
          title: 'Ordner ausgewählt',
          description: `Exportpfad gesetzt: ${name}`
        });
      }
    } catch (error) {
      console.error('Directory picker error:', error);
      toast({
        title: 'Fehler beim Ordner auswählen',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive'
      });
    } finally {
      setIsPickingDirectory(false);
    }
  };

  const handleCreateSubfolder = async () => {
    if (!settings.directoryHandle || !folderName.trim()) return;
    
    setIsCreatingFolder(true);
    try {
      const subHandle = await createSubdirectory(settings.directoryHandle, folderName.trim());
      await persistHandle(subHandle);
      const name = await getDirectoryName(subHandle);
      
      onSettingsChange({
        ...settings,
        directoryHandle: subHandle,
        directoryName: name
      });
      
      toast({
        title: 'Unterordner erstellt',
        description: `Neuer Exportpfad: ${name}`
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
          {!isSupported ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Ihr Browser unterstützt die Ordner-Auswahl nicht. Es wird der Standard-Download-Ordner verwendet.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1">
                  <Label>Gewählter Ordner</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {settings.directoryName ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {permissionStatus === 'granted' ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-red-500" />
                        )}
                        {settings.directoryName}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Kein Ordner ausgewählt
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleDirectoryPick}
                  disabled={isPickingDirectory}
                  variant="outline"
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {isPickingDirectory ? 'Auswählen...' : 'Ordner wählen'}
                </Button>
              </div>

              {settings.directoryHandle && permissionStatus === 'granted' && (
                <div className="space-y-3 pt-3 border-t">
                  <Label htmlFor="folder-name">Neuen Unterordner anlegen</Label>
                  <div className="flex gap-2">
                    <Input
                      id="folder-name"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      placeholder="Ordnername (z.B. ServiTracker)"
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

              {permissionStatus === 'denied' && settings.directoryHandle && (
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