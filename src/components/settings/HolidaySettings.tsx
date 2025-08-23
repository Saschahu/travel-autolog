import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Upload, Calendar, MapPin, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  HolidaySettings as HolidaySettingsType,
  DEFAULT_HOLIDAY_SETTINGS,
  saveHolidaySettings,
  loadHolidaySettings,
  getAvailableCountries,
  getAvailableRegions,
  saveICSEvents,
  listICSCalendars,
  removeICSCalendar
} from '@/lib/holidays';

export const HolidaySettings = () => {
  const [settings, setSettings] = useState<HolidaySettingsType>(DEFAULT_HOLIDAY_SETTINGS);
  const [availableRegions, setAvailableRegions] = useState<{ code: string; name: string }[]>([]);
  const [icsCalendars, setIcsCalendars] = useState<{ id: string; name: string; eventCount: number }[]>([]);
  const [uploadingICS, setUploadingICS] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loaded = loadHolidaySettings();
    setSettings(loaded);
    
    if (loaded.country) {
      const regions = getAvailableRegions(loaded.country);
      setAvailableRegions(regions);
    }
    
    setIcsCalendars(listICSCalendars());
  }, []);

  const handleCountryChange = (country: string) => {
    const regions = getAvailableRegions(country);
    setAvailableRegions(regions);
    
    const newSettings = {
      ...settings,
      country,
      region: regions.length > 0 ? regions[0].code : undefined,
      sources: [{ kind: 'builtin' as const, country, region: regions.length > 0 ? regions[0].code : undefined }]
    };
    
    setSettings(newSettings);
    saveHolidaySettings(newSettings);
  };

  const handleRegionChange = (region: string) => {
    const newSettings = {
      ...settings,
      region,
      sources: settings.sources.map(source => 
        source.kind === 'builtin' 
          ? { ...source, region }
          : source
      )
    };
    
    setSettings(newSettings);
    saveHolidaySettings(newSettings);
  };

  const handleTimezoneChange = (timezone: string) => {
    const newSettings = { ...settings, timezone };
    setSettings(newSettings);
    saveHolidaySettings(newSettings);
  };

  const handleICSUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadingICS(true);
    
    try {
      const content = await file.text();
      const id = `ics_${Date.now()}`;
      const name = file.name.replace('.ics', '');
      
      await saveICSEvents(id, name, content);
      
      // Update sources
      const newSources = [...settings.sources, { kind: 'ics' as const, id, name }];
      const newSettings = { ...settings, sources: newSources };
      setSettings(newSettings);
      saveHolidaySettings(newSettings);
      
      setIcsCalendars(listICSCalendars());
      
      toast({
        title: 'Kalender hinzugefügt',
        description: `${name} wurde erfolgreich importiert`,
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Fehler beim Importieren der ICS-Datei',
        variant: 'destructive',
      });
    } finally {
      setUploadingICS(false);
      event.target.value = ''; // Reset file input
    }
  };

  const handleRemoveICSCalendar = (id: string) => {
    removeICSCalendar(id);
    
    // Update sources
    const newSources = settings.sources.filter(source => 
      !(source.kind === 'ics' && source.id === id)
    );
    const newSettings = { ...settings, sources: newSources };
    setSettings(newSettings);
    saveHolidaySettings(newSettings);
    
    setIcsCalendars(listICSCalendars());
    
    toast({
      title: 'Kalender entfernt',
      description: 'Der Kalender wurde erfolgreich entfernt',
    });
  };

  const countries = getAvailableCountries();
  const commonTimezones = [
    'Europe/Berlin',
    'Europe/Vienna',
    'Europe/Zurich',
    'Europe/London',
    'Europe/Paris',
    'UTC'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Feiertage & Kalender
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Country and Region Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Land auswählen
              </Label>
              <Select value={settings.country} onValueChange={handleCountryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Land auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {availableRegions.length > 0 && (
              <div className="space-y-2">
                <Label>Region/Bundesland</Label>
                <Select value={settings.region} onValueChange={handleRegionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Region auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRegions.map(region => (
                      <SelectItem key={region.code} value={region.code}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Timezone Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Zeitzone
            </Label>
            <Select value={settings.timezone} onValueChange={handleTimezoneChange}>
              <SelectTrigger>
                <SelectValue placeholder="Zeitzone auswählen" />
              </SelectTrigger>
              <SelectContent>
                {commonTimezones.map(tz => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Aktuelle Zeitzone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
          </div>

          {/* ICS Calendar Upload */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Eigene Kalender (ICS)
              </Label>
              <div className="relative">
                <Input
                  type="file"
                  accept=".ics"
                  onChange={handleICSUpload}
                  disabled={uploadingICS}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" disabled={uploadingICS}>
                  {uploadingICS ? 'Lade...' : 'Kalender hinzufügen'}
                </Button>
              </div>
            </div>

            {/* List of ICS Calendars */}
            {icsCalendars.length > 0 && (
              <div className="space-y-2">
                <Label>Aktivierte Kalender</Label>
                <div className="space-y-2">
                  {icsCalendars.map(calendar => (
                    <div key={calendar.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">{calendar.name}</span>
                        <Badge variant="secondary">
                          {calendar.eventCount} Termine
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveICSCalendar(calendar.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Feiertage unterscheiden sich je nach Land/Region. Eigene ICS-Kalender werden zusätzlich berücksichtigt.
              ICS-Kalender haben Vorrang vor den Standard-Feiertagen.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};