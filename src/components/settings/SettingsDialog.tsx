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
  const [saving, setSaving] = useState(false);

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
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="gps">GPS</TabsTrigger>
            <TabsTrigger value="overtime">Overtime</TabsTrigger>
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
            {/* GPS Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-primary" />
                  {t('gpsSettings')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="gps-enabled">{t('enableGps')}</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable location tracking and notifications
                    </p>
                  </div>
                  <Switch
                    id="gps-enabled"
                    checked={formData.gpsEnabled}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, gpsEnabled: checked }))
                    }
                  />
                </div>

                {formData.homeAddress && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {t('homeLocation')}
                    </Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        {formData.homeAddress}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This address will be used for GPS home detection
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overtime" className="space-y-6">
            <OvertimeSettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};