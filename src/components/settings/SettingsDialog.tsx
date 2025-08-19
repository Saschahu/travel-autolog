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
import { User, MapPin, Settings, Home, Clock, Globe, FolderOpen } from 'lucide-react';
import { OvertimeSettings } from '@/components/settings/OvertimeSettings';
import { GPSSettingsComponent } from '@/components/gps/GPSSettingsComponent';
import { GPSSettings, defaultGPSSettings } from '@/types/gps';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  // Load GPS settings from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('gps_settings');
    if (stored) {
      try {
        setGpsSettings(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse GPS settings:', error);
      }
    }
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
      
      // Save GPS settings to localStorage
      localStorage.setItem('gps_settings', JSON.stringify(gpsSettings));
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">{t('profile')}</TabsTrigger>
            <TabsTrigger value="export">{t('export')}</TabsTrigger>
            <TabsTrigger value="gps">{t('gps')}</TabsTrigger>
            <TabsTrigger value="overtime">{t('overtime')}</TabsTrigger>
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
            {/* Export Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  Export & E-Mail Einstellungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="localStoragePath">Lokaler Speicherpfad</Label>
                  <Input
                    id="localStoragePath"
                    value={formData.localStoragePath}
                    onChange={(e) => setFormData(prev => ({ ...prev, localStoragePath: e.target.value }))}
                    placeholder="z.B. /Downloads oder C:\Dokumente\ServiceTracker"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Pfad für lokale Speicherung der Excel-Dateien. Wenn leer, wird der Standard-Download-Ordner verwendet.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailApp">Bevorzugte E-Mail-Anwendung</Label>
                  <Select
                    value={formData.preferredEmailApp}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, preferredEmailApp: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Standard E-Mail App</SelectItem>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="outlook">Outlook</SelectItem>
                      <SelectItem value="yahoo">Yahoo Mail</SelectItem>
                      <SelectItem value="protonmail">ProtonMail</SelectItem>
                      <SelectItem value="thunderbird">Thunderbird</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Diese E-Mail-App wird beim "Per E-Mail versenden" geöffnet
                  </p>
                </div>
              </CardContent>
            </Card>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};