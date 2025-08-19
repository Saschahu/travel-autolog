import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GPSSettingsData {
  styleId: string;
  homeGeofence: {
    latitude: number | null;
    longitude: number | null;
    radius: number;
  };
}

interface GPSSettingsProps {
  settings: GPSSettingsData;
  onSettingsChange: (settings: GPSSettingsData) => void;
}

export const GPSSettingsComponent: React.FC<GPSSettingsProps> = ({ 
  settings, 
  onSettingsChange 
}) => {
  const { toast } = useToast();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapboxToken, setMapboxToken] = useState(() => {
    return localStorage.getItem('mapbox_token') || '';
  });

  const updateSettings = (updates: Partial<GPSSettingsData>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const updateNestedSettings = <K extends keyof GPSSettingsData>(
    key: K, 
    updates: Partial<GPSSettingsData[K]>
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

      updateNestedSettings('homeGeofence', {
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

  const handleTokenSave = () => {
    localStorage.setItem('mapbox_token', mapboxToken);
    toast({
      title: 'Mapbox Token gespeichert',
      description: 'Token wurde erfolgreich gespeichert'
    });
  };

  return (
    <div className="space-y-6">
      {/* Mapbox Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Mapbox Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Token</Label>
            <div className="flex gap-2">
              <Input
                id="mapbox-token"
                type="password"
                placeholder="pk.eyJ1..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleTokenSave} variant="outline">
                Speichern
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Hol dir einen kostenlosen Token von <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mapbox-style">Map Style ID</Label>
            <Input
              id="mapbox-style"
              placeholder="mapbox://styles/mapbox/streets-v12"
              value={settings.styleId}
              onChange={(e) => updateSettings({ styleId: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Default: mapbox://styles/mapbox/streets-v12
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-xs">
                <p className="font-medium">Token Configuration</p>
                <p className="text-muted-foreground mt-1">
                  Mapbox-Token kommt aus VITE_MAPBOX_TOKEN (.env/Secret). 
                  Für lokale Entwicklung standardmäßig http://localhost:8080/* als URL-Restriction im Mapbox-Dashboard eintragen.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Home Geofence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-primary" />
            Home Geofence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home-lat">Latitude</Label>
              <Input
                id="home-lat"
                type="number"
                step="0.000001"
                placeholder="e.g., 47.3769"
                value={settings.homeGeofence.latitude || ''}
                onChange={(e) => updateNestedSettings('homeGeofence', {
                  latitude: e.target.value ? parseFloat(e.target.value) : null
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="home-lng">Longitude</Label>
              <Input
                id="home-lng"
                type="number"
                step="0.000001"
                placeholder="e.g., 8.5417"
                value={settings.homeGeofence.longitude || ''}
                onChange={(e) => updateNestedSettings('homeGeofence', {
                  longitude: e.target.value ? parseFloat(e.target.value) : null
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="home-radius">Radius (meters)</Label>
            <Input
              id="home-radius"
              type="number"
              min="10"
              max="1000"
              value={settings.homeGeofence.radius}
              onChange={(e) => updateNestedSettings('homeGeofence', {
                radius: parseInt(e.target.value) || 100
              })}
            />
            <p className="text-xs text-muted-foreground">
              Default: 100 meters
            </p>
          </div>

          <Button 
            onClick={getCurrentLocation} 
            disabled={isGettingLocation}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {isGettingLocation ? 'Getting location...' : 'Use Current Location'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};