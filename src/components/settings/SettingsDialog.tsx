import { validateEmailInput } from '@/lib/email';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { User, MapPin, Settings, Home, Clock, FolderOpen, AlertTriangle, Mail } from 'lucide-react';
import { OvertimeSettings } from '@/components/settings/OvertimeSettings';
import { HolidaySettings } from '@/components/settings/HolidaySettings';
import { GPSSettingsComponent } from '@/components/gps/GPSSettingsComponent';
import { ExportSettings } from './ExportSettings';
import { LanguageSettings } from './LanguageSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resetAppData } from '@/utils/resetAppData';
import { isFileSystemAccessSupported, loadHandle } from '@/lib/fsAccess';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  onGoDashboard?: () => void;
}

export const SettingsDialog = ({ open, onOpenChange, onSaved, onGoDashboard }: SettingsDialogProps) => {
  const { t, i18n } = useTranslation();
  const { profile, updateProfile } = useUserProfile();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    homeAddress: '',
    email: '',
    preferredEmailApp: 'default',
    gpsEnabled: false,
    localStoragePath: '',
    reportTo: '',
    reportCc: '',
    reportBcc: ''
  });

  // Export settings state
  const [exportSettings, setExportSettings] = useState<{
    directoryHandle?: any;
    directoryName: string;
    preferredEmailProvider: string;
    exportDirUri?: string;
  }>({
    directoryHandle: undefined,
    directoryName: '',
    preferredEmailProvider: 'mailto',
    exportDirUri: undefined
  });
  
  // GPS settings state (separate from profile data)
  const [gpsSettings, setGpsSettings] = useState({
    styleId: 'mapbox://styles/mapbox/streets-v12',
    homeGeofence: {
      latitude: null as number | null,
      longitude: null as number | null,
      radius: 100
    }
  });
  
  const [saving, setSaving] = useState(false);
  const [emailErrors, setEmailErrors] = useState<{ [key: string]: string[] }>({});

  // Load GPS and export settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load GPS settings
        const savedGps = localStorage.getItem('gps-settings');
        if (savedGps) {
          const parsed = JSON.parse(savedGps);
          setGpsSettings(prev => ({ ...prev, ...parsed }));
        }

        // Load export settings
        const savedExportProvider = localStorage.getItem('preferred-email-provider');
        const savedExportUri = localStorage.getItem('android-export-dir-uri');
        if (savedExportProvider) {
          setExportSettings(prev => ({ 
            ...prev, 
            preferredEmailProvider: savedExportProvider 
          }));
        }
        if (savedExportUri) {
          setExportSettings(prev => ({ 
            ...prev, 
            exportDirUri: savedExportUri,
            directoryName: 'Android Ordner' 
          }));
        }

        if (isFileSystemAccessSupported()) {
          const handle = await loadHandle();
          if (handle) {
            const name = handle.name || 'Ausgewählter Ordner';
            setExportSettings(prev => ({
              ...prev,
              directoryHandle: handle as any,
              directoryName: name
            }));
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Update form when profile changes
  useEffect(() => {
    setFormData({
      name: profile.name,
      homeAddress: profile.homeAddress,
      email: profile.email,
      preferredEmailApp: profile.preferredEmailApp,
      gpsEnabled: profile.gpsEnabled,
      localStoragePath: profile.localStoragePath,
      reportTo: profile.reportTo || '',
      reportCc: profile.reportCc || '',
      reportBcc: profile.reportBcc || ''
    });
  }, [profile]);

  const handleSave = async () => {
    if (saving) return;
    
    // Validate email fields before saving
    const emailValidation = {
      reportTo: validateEmailInput(formData.reportTo),
      reportCc: validateEmailInput(formData.reportCc),
      reportBcc: validateEmailInput(formData.reportBcc)
    };
    
    const newEmailErrors: { [key: string]: string[] } = {};
    let hasErrors = false;
    
    Object.entries(emailValidation).forEach(([field, validation]) => {
      if (!validation.valid) {
        newEmailErrors[field] = validation.errors;
        hasErrors = true;
      }
    });
    
    setEmailErrors(newEmailErrors);
    
    if (hasErrors) {
      toast({
        title: 'Validierungsfehler',
        description: 'Bitte korrigieren Sie die E-Mail-Adressen',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    console.log('handleSave started, formData:', formData);
    
    try {
      console.log('About to call updateProfile...');
      toast({ title: 'Speichern', description: 'Wird gespeichert…' });
      
      await updateProfile(formData);
      
      // Save GPS and export settings to localStorage
      localStorage.setItem('gps-settings', JSON.stringify(gpsSettings));
      localStorage.setItem('preferred-email-provider', exportSettings.preferredEmailProvider);
      if (exportSettings.exportDirUri) {
        localStorage.setItem('android-export-dir-uri', exportSettings.exportDirUri);
      } else {
        localStorage.removeItem('android-export-dir-uri');
      }
      console.log('updateProfile completed successfully');
      
      console.log('About to show success toast and close dialog');
      toast({
        title: 'Erfolg',
        description: 'Profil erfolgreich gespeichert',
      });
      
      console.log('Calling onOpenChange(false)');
      onOpenChange(false);
      console.log('Dialog should be closed now');
      onSaved?.();
      
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast({
        title: 'Fehler',
        description: 'Profil konnte nicht gespeichert werden',
        variant: 'destructive',
      });
    } finally {
      console.log('Setting saving to false');
      setSaving(false);
    }
  };

  const handleResetAppData = async () => {
    try {
      await resetAppData();
      toast({
        title: 'App-Daten gelöscht',
        description: 'Die App wird neu geladen...',
      });
      
      // Reload the app after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error resetting app data:', error);
      toast({
        title: 'Fehler',
        description: 'App-Daten konnten nicht zurückgesetzt werden',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            {t('settings')}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
            <TabsTrigger value="export">{t('export')}</TabsTrigger>
            <TabsTrigger value="gps">{t('gps')}</TabsTrigger>
            <TabsTrigger value="overtime">{t('overtime')}</TabsTrigger>
            <TabsTrigger value="holidays">{t('holidays')}</TabsTrigger>
            <TabsTrigger value="advanced">{t('advanced')}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); console.log('Settings form submitted'); handleSave(); }}>
              <div className="space-y-6">
                {/* User Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4 text-primary" />
                      {t('userProfile')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('name')}</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Max Mustermann"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="homeAddress">{t('homeAddress')}</Label>
                      <Input
                        id="homeAddress"
                        value={formData.homeAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, homeAddress: e.target.value }))}
                        placeholder="Musterstraße 123, 12345 Berlin"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">{t('email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="max@example.com"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Email Report Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Mail className="h-4 w-4 text-primary" />
                      E-Mail-Versand Einstellungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reportTo">
                        Standard-Empfänger (TO)
                        <span className="text-xs text-muted-foreground block">
                          Mehrere Adressen durch Komma oder Semikolon trennen
                        </span>
                      </Label>
                      <Input
                        id="reportTo"
                        type="email"
                        value={formData.reportTo}
                        onChange={(e) => setFormData(prev => ({ ...prev, reportTo: e.target.value }))}
                        placeholder="empfaenger@firma.com, chef@firma.com"
                        className={emailErrors.reportTo ? 'border-destructive' : ''}
                      />
                      {emailErrors.reportTo && (
                        <div className="text-sm text-destructive">
                          {emailErrors.reportTo.map((error, i) => (
                            <div key={i}>{error}</div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reportCc">
                        CC (optional)
                        <span className="text-xs text-muted-foreground block">
                          Mehrere Adressen durch Komma oder Semikolon trennen
                        </span>
                      </Label>
                      <Input
                        id="reportCc"
                        type="email"
                        value={formData.reportCc}
                        onChange={(e) => setFormData(prev => ({ ...prev, reportCc: e.target.value }))}
                        placeholder="cc@firma.com"
                        className={emailErrors.reportCc ? 'border-destructive' : ''}
                      />
                      {emailErrors.reportCc && (
                        <div className="text-sm text-destructive">
                          {emailErrors.reportCc.map((error, i) => (
                            <div key={i}>{error}</div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reportBcc">
                        BCC (optional)
                        <span className="text-xs text-muted-foreground block">
                          Mehrere Adressen durch Komma oder Semikolon trennen
                        </span>
                      </Label>
                      <Input
                        id="reportBcc"
                        type="email"
                        value={formData.reportBcc}
                        onChange={(e) => setFormData(prev => ({ ...prev, reportBcc: e.target.value }))}
                        placeholder="bcc@firma.com"
                        className={emailErrors.reportBcc ? 'border-destructive' : ''}
                      />
                      {emailErrors.reportBcc && (
                        <div className="text-sm text-destructive">
                          {emailErrors.reportBcc.map((error, i) => (
                            <div key={i}>{error}</div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        <strong>Hinweis:</strong> Die E-Mail wird aus Ihrer Mail-App gesendet. 
                        Das Absender-Konto steuern Sie in der Mail-App.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Language Settings */}
                <LanguageSettings />

                <div className="flex gap-2 pt-4 sticky bottom-0 bg-background border-t p-4 -m-4 mt-0">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => { console.log('Dashboard button clicked'); onOpenChange(false); onGoDashboard?.(); }}
                    className="flex-1 h-12 text-base font-medium touch-manipulation"
                  >
                    {t('dashboard')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 h-12 text-base font-medium touch-manipulation"
                  >
                    {saving ? t('saving') : t('save')}
                  </Button>
                </div>
                
              </div>
            </form>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <ExportSettings 
              settings={exportSettings}
              onSettingsChange={setExportSettings}
            />
          </TabsContent>

          <TabsContent value="gps" className="space-y-6">
            <GPSSettingsComponent 
              settings={gpsSettings}
              onSettingsChange={setGpsSettings}
            />
          </TabsContent>

          <TabsContent value="overtime" className="space-y-6">
            <OvertimeSettings />
          </TabsContent>
          
          <TabsContent value="holidays" className="space-y-6">
            <HolidaySettings />
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  {t('advancedSettings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">{t('resetAppData')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('resetAppDescription')}
                  </p>
                  <Button 
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={handleResetAppData}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {t('deleteAppData')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};