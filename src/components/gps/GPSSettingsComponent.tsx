// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, AlertTriangle, Home, Navigation, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  GeofenceMonitor, 
  loadHomeGeofence, 
  saveHomeGeofence,
  formatCoordinates,
  formatDistance,
  getCurrentPosition 
} from '@/lib/geo';

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
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapboxToken, setMapboxToken] = useState(() => {
    return localStorage.getItem('mapbox_token') || '';
  });
  const [geofenceMonitor] = useState(() => new GeofenceMonitor());
  const [geofenceStatus, setGeofenceStatus] = useState<{
    isAtHome: boolean;
    distance?: number;
    isWatching: boolean;
  }>({
    isAtHome: false,
    distance: undefined,
    isWatching: false
  });

  // Helper functions - defined before useEffects
  const updateSettings = (updates: Partial<GPSSettingsData>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const updateNestedSettings = useCallback(<K extends keyof GPSSettingsData>(
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
  }, [settings, onSettingsChange]);

  // Load saved home geofence on mount
  useEffect(() => {
    const savedHome = loadHomeGeofence();
    if (savedHome) {
      updateNestedSettings('homeGeofence', {
        latitude: savedHome.latitude,
        longitude: savedHome.longitude,
        radius: savedHome.radius
      });
      geofenceMonitor.setHome(savedHome);
    }
  }, [geofenceMonitor, updateNestedSettings]);

  // Set up geofence status listener
  useEffect(() => {
    const handleStatusChange = (isAtHome: boolean, distance?: number) => {
      setGeofenceStatus(prev => ({
        ...prev,
        isAtHome,
        distance
      }));
    };

    geofenceMonitor.onStatusChange(handleStatusChange);
    
    return () => {
      geofenceMonitor.removeListener(handleStatusChange);
      geofenceMonitor.stopWatching();
    };
  }, [geofenceMonitor]);

  const setCurrentAsHome = async () => {
    setIsGettingLocation(true);
    
    // Start with IP fallback immediately in parallel
    const ipFallbackPromise = (async () => {
      try {
        const resp = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) });
        const data = await resp.json();
        if (data?.latitude && data?.longitude) {
          return {
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            source: 'ip' as const
          };
        }
      } catch {
        return null;
      }
      return null;
    })();

    try {
      // Try GPS first with 30s timeout
      const position = await getCurrentPosition();

      const homeGeofence = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        radius: settings.homeGeofence.radius
      };

      updateNestedSettings('homeGeofence', {
        latitude: homeGeofence.latitude,
        longitude: homeGeofence.longitude
      });

      saveHomeGeofence(homeGeofence);
      geofenceMonitor.setHome(homeGeofence);

      toast({
        title: 'Home-Position gesetzt',
        description: `GPS: ${formatCoordinates(homeGeofence.latitude, homeGeofence.longitude)}`
      });

    } catch (err: any) {
      // GPS failed - use IP fallback
      const ipResult = await ipFallbackPromise;
      
      if (ipResult) {
        const homeGeofence = {
          latitude: ipResult.latitude,
          longitude: ipResult.longitude,
          radius: settings.homeGeofence.radius
        };

        updateNestedSettings('homeGeofence', {
          latitude: homeGeofence.latitude,
          longitude: homeGeofence.longitude
        });

        saveHomeGeofence(homeGeofence);
        geofenceMonitor.setHome(homeGeofence);

        toast({
          title: 'Home-Position (ungefähr) gesetzt',
          description: `IP-basiert: ${formatCoordinates(homeGeofence.latitude, homeGeofence.longitude)} — Geringe Genauigkeit`,
          variant: 'default'
        });
      } else {
        // Both failed
        const code = typeof err === 'object' && err?.code != null ? Number(err.code) : undefined;
        const friendly =
          code === 1
            ? 'GPS-Berechtigung verweigert. Bitte erlaube den Standortzugriff in den Browser-Einstellungen.'
            : code === 2
            ? 'Standortinformationen sind nicht verfügbar.'
            : code === 3
            ? 'GPS-Zeitüberschreitung. Versuchen Sie es draußen oder am Fenster erneut.'
            : (err?.message || 'Standort konnte nicht ermittelt werden');

        toast({
          title: 'Fehler beim Abrufen der Position',
          description: friendly,
          variant: 'destructive'
        });
      }
    } finally {
      setIsGettingLocation(false);
    }
  };
  const saveHomeSettings = () => {
    const { latitude, longitude, radius } = settings.homeGeofence;
    
    if (latitude !== null && longitude !== null) {
      const homeGeofence = { latitude, longitude, radius };
      saveHomeGeofence(homeGeofence);
      geofenceMonitor.setHome(homeGeofence);
      
      toast({
        title: 'Home-Position gespeichert',
        description: `Position: ${formatCoordinates(latitude, longitude)}, Radius: ${radius}m`
      });
    } else {
      toast({
        title: 'Ungültige Position',
        description: 'Bitte geben Sie gültige Koordinaten ein',
        variant: 'destructive'
      });
    }
  };

  const toggleGeofenceMonitoring = () => {
    if (geofenceStatus.isWatching) {
      geofenceMonitor.stopWatching();
      setGeofenceStatus(prev => ({ ...prev, isWatching: false }));
      toast({
        title: 'Geofence-Monitoring gestoppt',
        description: 'Positionsüberwachung deaktiviert'
      });
    } else {
      const success = geofenceMonitor.startWatching();
      if (success) {
        setGeofenceStatus(prev => ({ ...prev, isWatching: true }));
        toast({
          title: 'Geofence-Monitoring gestartet',
          description: 'Positionsüberwachung aktiviert'
        });
      } else {
        toast({
          title: 'Fehler',
          description: 'Geofence-Monitoring konnte nicht gestartet werden',
          variant: 'destructive'
        });
      }
    }
  };

  const handleTokenSave = () => {
    localStorage.setItem('mapbox_token', mapboxToken);
    toast({
      title: t('common:gpsSettings.mapboxTokenSaved'),
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
            {t('common:gpsSettings.mapboxSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">{t('common:gpsSettings.mapboxPublicToken')}</Label>
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
                {t('common:save')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('common:gpsSettings.getTokenFromMapbox')} <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mapbox-style">{t('common:gpsSettings.mapStyleId')}</Label>
            <Input
              id="mapbox-style"
              placeholder="mapbox://styles/mapbox/streets-v12"
              value={settings.styleId}
              onChange={(e) => updateSettings({ styleId: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {t('common:gpsSettings.mapStyleDefault')}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-xs">
                <p className="font-medium">{t('common:gpsSettings.tokenConfig')}</p>
                <p className="text-muted-foreground mt-1">
                  {t('common:gpsSettings.tokenConfigDesc')}
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
            <Home className="h-4 w-4 text-primary" />
            {t('common:gpsSettings.homeGeofence')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Display */}
          {settings.homeGeofence.latitude && settings.homeGeofence.longitude ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{t('common:gpsSettings.homePositionSet')}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCoordinates(settings.homeGeofence.latitude, settings.homeGeofence.longitude)} 
                    • {t('common:gpsSettings.radius')}: {settings.homeGeofence.radius}m
                  </p>
                </div>
                <Badge variant={geofenceStatus.isAtHome ? 'default' : 'secondary'}>
                  {geofenceStatus.isAtHome ? t('common:gpsSettings.atHome') : t('common:gpsSettings.away')}
                  {geofenceStatus.distance && (
                    <span className="ml-1">({formatDistance(geofenceStatus.distance)})</span>
                  )}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={toggleGeofenceMonitoring}
                  variant={geofenceStatus.isWatching ? 'destructive' : 'outline'}
                  size="sm"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {geofenceStatus.isWatching ? t('common:gpsSettings.stopMonitoring') : t('common:gpsSettings.startMonitoring')}
                </Button>
              </div>
            </div>
          ) : (
            <Alert>
              <Home className="h-4 w-4" />
              <AlertDescription>
                {t('common:gpsSettings.noHomePosition')}
              </AlertDescription>
            </Alert>
          )}

          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home-lat">{t('common:gpsSettings.latitude')}</Label>
              <Input
                id="home-lat"
                type="number"
                step="0.000001"
                placeholder="z.B. 47.3769"
                value={settings.homeGeofence.latitude || ''}
                onChange={(e) => updateNestedSettings('homeGeofence', {
                  latitude: e.target.value ? parseFloat(e.target.value) : null
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="home-lng">{t('common:gpsSettings.longitude')}</Label>
              <Input
                id="home-lng"
                type="number"
                step="0.000001"
                placeholder="z.B. 8.5417"
                value={settings.homeGeofence.longitude || ''}
                onChange={(e) => updateNestedSettings('homeGeofence', {
                  longitude: e.target.value ? parseFloat(e.target.value) : null
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="home-radius">{t('common:gpsSettings.radiusLabel')}</Label>
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
              {t('common:gpsSettings.radiusDefault')}
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={setCurrentAsHome} 
              disabled={isGettingLocation}
              className="flex-1"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isGettingLocation ? t('common:gpsSettings.gettingLocation') : t('common:gpsSettings.getCurrentLocation')}
            </Button>
            
            <Button
              onClick={saveHomeSettings}
              disabled={!settings.homeGeofence.latitude || !settings.homeGeofence.longitude}
              variant="outline"
            >
              {t('common:save')}
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t('common:gpsSettings.geofenceWarning')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};