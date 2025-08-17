import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Globe, Navigation } from 'lucide-react';
import { useUserProfile } from '@/contexts/UserProfileContext';
import { useToast } from '@/hooks/use-toast';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { t, i18n } = useTranslation();
  const { profile, updateProfile } = useUserProfile();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    homeAddress: '',
    email: '',
    preferredEmailApp: 'default',
    preferredLanguage: 'de' as 'en' | 'de' | 'no',
    gpsEnabled: false
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
      gpsEnabled: profile.gpsEnabled
    });
  }, [profile]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      console.log('Saving profile...', formData);
      toast({ title: 'Speichern', description: 'Wird gespeichert…' });
      await updateProfile(formData);
      console.log('Profile saved successfully');
      
      // Change app language if language was updated
      if (formData.preferredLanguage !== profile.preferredLanguage) {
        console.log('Changing language to:', formData.preferredLanguage);
        i18n.changeLanguage(formData.preferredLanguage);
      }
      
      toast({
        title: 'Erfolg',
        description: 'Profil erfolgreich gespeichert',
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Fehler',
        description: 'Profil konnte nicht gespeichert werden',
        variant: 'destructive',
      });
    } finally {
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Nutzerdaten
          </DialogTitle>
        </DialogHeader>

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
                <Label htmlFor="emailApp">{t('preferredEmailApp')}</Label>
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
                    <SelectItem value="default">Standard Email App</SelectItem>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="outlook">Outlook</SelectItem>
                    <SelectItem value="yahoo">Yahoo Mail</SelectItem>
                    <SelectItem value="protonmail">ProtonMail</SelectItem>
                  </SelectContent>
                </Select>
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

          <Separator />

          {/* GPS Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Navigation className="h-4 w-4 text-primary" />
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

          <div className="flex gap-2 pt-4 sticky bottom-0 bg-background border-t p-4 -m-4 mt-0">
            <Button 
              type="button"
              onClick={() => { if (saving) return; console.log('Save button onClick'); handleSave(); }}
              onPointerUp={() => { if (saving) return; console.log('Save button pointerUp'); handleSave(); }}
              onTouchStart={() => { if (saving) return; console.log('Save button touchStart'); handleSave(); }}
              className="w-full h-12 text-base font-medium touch-manipulation pointer-events-auto"
            >
              {saving ? 'Speichern…' : 'Speichern'}
            </Button>
          </div>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};