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
import { User, MapPin, Settings, Home, Clock, Globe, FolderOpen, AlertTriangle } from 'lucide-react';
import { OvertimeSettings } from '@/components/settings/OvertimeSettings';
import { GPSSettingsComponent } from '@/components/gps/GPSSettingsComponent';
import { ExportSettings } from '@/components/settings/ExportSettings';
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
    preferredLanguage: 'de' as 'en' | 'de' | 'no',
    gpsEnabled: false,
    localStoragePath: ''
  });

  // Export settings state
  const [exportSettings, setExportSettings] = useState<{
    directoryHandle?: any;
    directoryName: string;
    preferredEmailProvider: string;
  }>({
    directoryHandle: undefined,
    directoryName: '',
    preferredEmailProvider: 'mailto'
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
        if (savedExportProvider) {
          setExportSettings(prev => ({ 
            ...prev, 
            preferredEmailProvider: savedExportProvider 
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
      preferredLanguage: profile.preferredLanguage,
      gpsEnabled: profile.gpsEnabled,
      localStoragePath: profile.localStoragePath
    });
  }, [profile]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    console.log('handleSave started, formData:', formData);
    
    try {
      console.log('About to call updateProfile...');
      toast({ title: 'Speichern', description: 'Wird gespeichert…' });
      
      await updateProfile(formData);
      
      // Save GPS and export settings to localStorage
      localStorage.setItem('gps-settings', JSON.stringify(gpsSettings));
      localStorage.setItem('preferred-email-provider', exportSettings.preferredEmailProvider);
      console.log('updateProfile completed successfully');
      
      // Change app language if language was updated
      if (formData.preferredLanguage !== profile.preferredLanguage) {
        console.log('Changing language to:', formData.preferredLanguage);
        i18n.changeLanguage(formData.preferredLanguage);
      }
      
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

  const languageOptions = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
    { value: 'no', label: 'Norsk' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Einstellungen
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
            <TabsTrigger value="export">{t('export')}</TabsTrigger>
            <TabsTrigger value="gps">{t('gps')}</TabsTrigger>
            <TabsTrigger value="overtime">{t('overtime')}</TabsTrigger>
            <TabsTrigger value="advanced">Erweitert</TabsTrigger>
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


                    <div className="space-y-2">
                      <Label htmlFor="language">{t('preferredLanguage')}</Label>
                      <Select
                        value={formData.preferredLanguage}
                        onValueChange={(value: 'en' | 'de' | 'no') => 
                          setFormData(prev => ({ ...prev, preferredLanguage: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {languageOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-2 pt-4 sticky bottom-0 bg-background border-t p-4 -m-4 mt-0">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => { console.log('Dashboard button clicked'); onOpenChange(false); onGoDashboard?.(); }}
                    className="flex-1 h-12 text-base font-medium touch-manipulation"
                  >
                    Dashboard
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 h-12 text-base font-medium touch-manipulation"
                  >
                    {saving ? 'Speichern…' : 'Speichern'}
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
          
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Erweiterte Einstellungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-medium">Appdaten zurücksetzen</Label>
                  <p className="text-sm text-muted-foreground">
                    Löscht alle lokal gespeicherten Daten, Einstellungen und den Cache. 
                    Die App wird nach dem Reset neu geladen.
                  </p>
                  <Button 
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={handleResetAppData}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    App-Daten löschen
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