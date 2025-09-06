import React, { useState, useEffect } from 'react';
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
  }, []);

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

  const setCurrentAsHome = async () => {
    setIsGettingLocation(true);
    try {
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

      // Save to storage and update geofence monitor
      saveHomeGeofence(homeGeofence);
      geofenceMonitor.setHome(homeGeofence);

      toast({
        title: 'Home-Position gesetzt',
        description: `Position: ${formatCoordinates(homeGeofence.latitude, homeGeofence.longitude)}`
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
      title: t('mapboxTokenSaved'),
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
            {t('mapboxSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">{t('mapboxPublicToken')}</Label>
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
                {t('save')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('getTokenFromMapbox')} <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mapbox-style">{t('mapStyleId')}</Label>
            <Input
              id="mapbox-style"
              placeholder="mapbox://styles/mapbox/streets-v12"
              value={settings.styleId}
              onChange={(e) => updateSettings({ styleId: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {t('mapStyleDefault')}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-xs">
                <p className="font-medium">{t('tokenConfig')}</p>
                <p className="text-muted-foreground mt-1">
                  {t('tokenConfigDesc')}
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
            {t('homeGeofence')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Display */}
          {settings.homeGeofence.latitude && settings.homeGeofence.longitude ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{t('homePositionSet')}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatCoordinates(settings.homeGeofence.latitude, settings.homeGeofence.longitude)} 
                    • {t('radius')}: {settings.homeGeofence.radius}m
                  </p>
                </div>
                <Badge variant={geofenceStatus.isAtHome ? 'default' : 'secondary'}>
                  {geofenceStatus.isAtHome ? t('atHome') : t('away')}
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
                  {geofenceStatus.isWatching ? t('stopMonitoring') : t('startMonitoring')}
                </Button>
              </div>
            </div>
          ) : (
            <Alert>
              <Home className="h-4 w-4" />
              <AlertDescription>
                {t('noHomePosition')}
              </AlertDescription>
            </Alert>
          )}

          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home-lat">{t('latitude')}</Label>
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
              <Label htmlFor="home-lng">{t('longitude')}</Label>
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
            <Label htmlFor="home-radius">{t('radiusLabel')}</Label>
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
              {t('radiusDefault')}
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={setCurrentAsHome} 
              disabled={isGettingLocation}
              className="flex-1"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {isGettingLocation ? t('gettingLocation') : t('getCurrentLocation')}
            </Button>
            
            <Button
              onClick={saveHomeSettings}
              disabled={!settings.homeGeofence.latitude || !settings.homeGeofence.longitude}
              variant="outline"
            >
              {t('save')}
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t('geofenceWarning')}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};