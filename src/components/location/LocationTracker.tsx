import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Play, Square, Home, Navigation, Globe } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { LocationMap } from './LocationMap';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export const LocationTracker: React.FC = () => {
  const { t } = useTranslation('common');
  const {
    currentLocation,
    homeLocation,
    isTracking,
    isAtHome,
    error,
    hasPermissions,
    startTracking,
    stopTracking,
    setCurrentAsHome,
    getCurrentPosition,
    requestPermissions
  } = useLocation();

  const handleStartTracking = async () => {
    if (!hasPermissions) {
      await requestPermissions();
    }
    await startTracking();
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            {t('gps')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={isTracking ? "default" : "secondary"}>
              {isTracking ? t('locationTracking.active') : t('locationTracking.stopped')}
            </Badge>
            {isAtHome !== null && (
              <Badge variant={isAtHome ? "default" : "secondary"}>
                {isAtHome ? t('locationTracking.atHome') : t('locationTracking.onTheGo')}
              </Badge>
            )}
            <Badge variant={hasPermissions ? "default" : "destructive"}>
              {hasPermissions ? t('locationTracking.permissionGranted') : t('locationTracking.permissionMissing')}
            </Badge>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
              {error}
            </div>
          )}

          {/* Current Location Info */}
          {currentLocation && (
            <div className="space-y-2">
              <h4 className="font-medium">{t('locationTracking.currentPosition')}:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>{t('locationTracking.latitude')}: {currentLocation.latitude.toFixed(6)}</div>
                <div>{t('locationTracking.longitude')}: {currentLocation.longitude.toFixed(6)}</div>
                <div>{t('locationTracking.timestamp')}: {currentLocation.timestamp.toLocaleString('de-DE')}</div>
              </div>
            </div>
          )}

          {/* Home Location Info */}
          {homeLocation && (
            <div className="space-y-2">
              <h4 className="font-medium">{t('locationTracking.homeLocation')}:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>{t('locationTracking.latitude')}: {homeLocation.latitude.toFixed(6)}</div>
                <div>{t('locationTracking.longitude')}: {homeLocation.longitude.toFixed(6)}</div>
                <div>{t('locationTracking.radius')}: {homeLocation.radius}m</div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2">
            {!hasPermissions && (
              <Button onClick={requestPermissions} variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                {t('locationTracking.requestPermission')}
              </Button>
            )}
            
            <Button onClick={() => getCurrentPosition()} variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              {t('locationTracking.gpsPosition')}
            </Button>

            <Button onClick={() => getCurrentPosition(true)} variant="outline">
              <Globe className="h-4 w-4 mr-2" />
              {t('locationTracking.ipPosition')}
            </Button>

            {currentLocation && !homeLocation && (
              <Button onClick={() => setCurrentAsHome()} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                {t('locationTracking.setAsHome')}
              </Button>
            )}

            {!isTracking ? (
              <Button onClick={handleStartTracking}>
                <Play className="h-4 w-4 mr-2" />
                {t('locationTracking.startTracking')}
              </Button>
            ) : (
              <Button onClick={() => stopTracking()} variant="outline">
                <Square className="h-4 w-4 mr-2" />
                {t('locationTracking.stopTracking')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <LocationMap
        currentLocation={currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          timestamp: new Date(currentLocation.timestamp)
        } : undefined}
        homeLocation={homeLocation}
        jobLocations={[
          // Beispiel-Job-Standorte - diese sollten aus der Datenbank kommen
          {
            id: '1',
            latitude: 52.5200,
            longitude: 13.4050,
            customerName: 'Berliner Kunde',
            startDate: new Date()
          },
          {
            id: '2', 
            latitude: 48.1351,
            longitude: 11.5820,
            customerName: 'Münchener Kunde',
            startDate: new Date()
          }
        ]}
        className="h-[500px] w-full"
      />
    </div>
  );
};