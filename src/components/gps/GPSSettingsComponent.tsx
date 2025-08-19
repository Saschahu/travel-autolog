import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { MapPin, Settings, Bell, Database, Map, Smartphone, AlertTriangle } from 'lucide-react';
import { GPSSettings, defaultGPSSettings } from '@/types/gps';
import { useToast } from '@/hooks/use-toast';

interface GPSSettingsProps {
  settings: GPSSettings;
  onSettingsChange: (settings: GPSSettings) => void;
}

export const GPSSettingsComponent: React.FC<GPSSettingsProps> = ({ 
  settings, 
  onSettingsChange 
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Check if running in Capacitor
  const isCapacitor = typeof window !== 'undefined' && 'Capacitor' in window;

  const updateSettings = (updates: Partial<GPSSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const updateNestedSettings = <K extends keyof GPSSettings>(
    key: K, 
    updates: Partial<GPSSettings[K]>
  ) => {
    const currentValue = settings[key];
    if (typeof currentValue === 'object' && currentValue !== null) {
      onSettingsChange({
        ...settings,
        [key]: { ...currentValue, ...updates }
      });
    }
  };

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation wird von diesem Browser nicht unterstützt');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      updateNestedSettings('homeLocation', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });

      toast({
        title: 'Home-Standort gesetzt',
        description: `Position: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
      });

    } catch (error) {
      toast({
        title: 'Fehler beim Abrufen der Position',
        description: error instanceof Error ? error.message : 'Unbekannter Fehler',
        variant: 'destructive'
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main GPS Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-primary" />
            GPS System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="gps-main-enabled">GPS-Tracking aktivieren</Label>
              <p className="text-xs text-muted-foreground">
                Hauptschalter für das gesamte GPS-System
              </p>
            </div>
            <Switch
              id="gps-main-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSettings({ enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Home Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Home-Standort
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home-lat">Breitengrad</Label>
              <Input
                id="home-lat"
                type="number"
                step="0.000001"
                placeholder="z.B. 47.3769"
                value={settings.homeLocation.latitude || ''}
                onChange={(e) => updateNestedSettings('homeLocation', {
                  latitude: e.target.value ? parseFloat(e.target.value) : null
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="home-lng">Längengrad</Label>
              <Input
                id="home-lng"
                type="number"
                step="0.000001"
                placeholder="z.B. 8.5417"
                value={settings.homeLocation.longitude || ''}
                onChange={(e) => updateNestedSettings('homeLocation', {
                  longitude: e.target.value ? parseFloat(e.target.value) : null
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="home-radius">Radius (Meter)</Label>
            <Input
              id="home-radius"
              type="number"
              min="10"
              max="1000"
              value={settings.homeLocation.radius}
              onChange={(e) => updateNestedSettings('homeLocation', {
                radius: parseInt(e.target.value) || 100
              })}
            />
            <p className="text-xs text-muted-foreground">
              Empfohlen: 50-200 Meter je nach Umgebung
            </p>
          </div>

          <Button 
            onClick={getCurrentLocation} 
            disabled={isGettingLocation}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {isGettingLocation ? 'Position wird abgerufen...' : 'Aktuelle Position als Home übernehmen'}
          </Button>
        </CardContent>
      </Card>

      {/* Movement Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4 text-primary" />
            Schwellenwerte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Bewegung erkannt bei:</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="moving-speed" className="text-xs">Geschwindigkeit ≥ (m/s)</Label>
                  <Input
                    id="moving-speed"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={settings.thresholds.movingSpeed}
                    onChange={(e) => updateNestedSettings('thresholds', {
                      movingSpeed: parseFloat(e.target.value) || 1.5
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="moving-distance" className="text-xs">ODER ≥ (m) in 2 min</Label>
                  <Input
                    id="moving-distance"
                    type="number"
                    min="10"
                    max="500"
                    value={settings.thresholds.movingDistance}
                    onChange={(e) => updateNestedSettings('thresholds', {
                      movingDistance: parseInt(e.target.value) || 150
                    })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium">Stationär erkannt nach:</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="stationary-time" className="text-xs">Zeit (min)</Label>
                  <Input
                    id="stationary-time"
                    type="number"
                    min="1"
                    max="60"
                    value={settings.thresholds.stationaryTime}
                    onChange={(e) => updateNestedSettings('thresholds', {
                      stationaryTime: parseInt(e.target.value) || 10
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stationary-speed" className="text-xs">Geschw. &lt; (m/s)</Label>
                  <Input
                    id="stationary-speed"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={settings.thresholds.stationarySpeed}
                    onChange={(e) => updateNestedSettings('thresholds', {
                      stationarySpeed: parseFloat(e.target.value) || 0.5
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stationary-distance" className="text-xs">Delta &lt; (m)</Label>
                  <Input
                    id="stationary-distance"
                    type="number"
                    min="1"
                    max="200"
                    value={settings.thresholds.stationaryDistance}
                    onChange={(e) => updateNestedSettings('thresholds', {
                      stationaryDistance: parseInt(e.target.value) || 50
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            Benachrichtigungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-enabled">Benachrichtigungen aktivieren</Label>
              <p className="text-xs text-muted-foreground">
                Push-Benachrichtigungen für Bestätigungen
              </p>
            </div>
            <Switch
              id="notifications-enabled"
              checked={settings.notifications.enabled}
              onCheckedChange={(checked) => updateNestedSettings('notifications', {
                enabled: checked
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-sound">Ton abspielen</Label>
              <p className="text-xs text-muted-foreground">
                Kurzer Benachrichtigungston
              </p>
            </div>
            <Switch
              id="notifications-sound"
              checked={settings.notifications.sound}
              onCheckedChange={(checked) => updateNestedSettings('notifications', {
                sound: checked
              })}
              disabled={!settings.notifications.enabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-actions">Action-Buttons</Label>
              <p className="text-xs text-muted-foreground">
                Direktantwort-Buttons in Benachrichtigungen
              </p>
            </div>
            <Switch
              id="notifications-actions"
              checked={settings.notifications.actions}
              onCheckedChange={(checked) => updateNestedSettings('notifications', {
                actions: checked
              })}
              disabled={!settings.notifications.enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Capture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" />
            Datenerfassung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accuracy-threshold">Genauigkeitsschwelle (m)</Label>
              <Input
                id="accuracy-threshold"
                type="number"
                min="1"
                max="200"
                value={settings.capture.accuracyThreshold}
                onChange={(e) => updateNestedSettings('capture', {
                  accuracyThreshold: parseInt(e.target.value) || 50
                })}
              />
              <p className="text-xs text-muted-foreground">
                Messungen über diesem Wert werden verworfen
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sampling-interval">Sampling-Intervall (s)</Label>
              <Input
                id="sampling-interval"
                type="number"
                min="1"
                max="60"
                value={settings.capture.samplingInterval}
                onChange={(e) => updateNestedSettings('capture', {
                  samplingInterval: parseInt(e.target.value) || 5
                })}
              />
              <p className="text-xs text-muted-foreground">
                GPS-Abfrage alle X Sekunden
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapbox Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="h-4 w-4 text-primary" />
            Mapbox-Einstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mapbox-style">Kartenstil</Label>
            <Select
              value={settings.mapbox.styleId}
              onValueChange={(value) => updateNestedSettings('mapbox', {
                styleId: value
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mapbox://styles/mapbox/streets-v12">Streets</SelectItem>
                <SelectItem value="mapbox://styles/mapbox/outdoors-v12">Outdoors</SelectItem>
                <SelectItem value="mapbox://styles/mapbox/light-v11">Light</SelectItem>
                <SelectItem value="mapbox://styles/mapbox/dark-v11">Dark</SelectItem>
                <SelectItem value="mapbox://styles/mapbox/satellite-v9">Satellite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-zoom">Min. Zoom</Label>
              <Input
                id="min-zoom"
                type="number"
                min="0"
                max="20"
                value={settings.mapbox.minZoom}
                onChange={(e) => updateNestedSettings('mapbox', {
                  minZoom: parseInt(e.target.value) || 5
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max-zoom">Max. Zoom</Label>
              <Input
                id="max-zoom"
                type="number"
                min="0"
                max="24"
                value={settings.mapbox.maxZoom}
                onChange={(e) => updateNestedSettings('mapbox', {
                  maxZoom: parseInt(e.target.value) || 20
                })}
              />
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-xs">
                <p className="font-medium">Mapbox Token erforderlich</p>
                <p className="text-muted-foreground mt-1">
                  Setzen Sie VITE_MAPBOX_TOKEN in der Umgebung oder geben Sie den Token direkt in der Karte ein.
                  Ihr kostenloses Token finden Sie auf <span className="text-primary">mapbox.com</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacitor/Android Settings */}
      {isCapacitor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="h-4 w-4 text-primary" />
              Android/Mobile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="background-mode">Background-Tracking</Label>
                <p className="text-xs text-muted-foreground">
                  Foreground-Service für zuverlässiges Tracking
                </p>
              </div>
              <Switch
                id="background-mode"
                checked={settings.backgroundMode}
                onCheckedChange={(checked) => updateSettings({ backgroundMode: checked })}
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs space-y-2">
                <p className="font-medium">Wichtige Hinweise für Android:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• App zur Akku-Optimierung-Whitelist hinzufügen</li>
                  <li>• Standortberechtigung auf "Immer" setzen</li>
                  <li>• Autostart aktivieren (je nach Hersteller)</li>
                  <li>• Bei Problemen: Doze-Modus für App deaktivieren</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};