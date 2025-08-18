import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Play, Square, Home, Navigation } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { LocationMap } from './LocationMap';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export const LocationTracker: React.FC = () => {
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
            Standortverfolgung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={isTracking ? "default" : "secondary"}>
              {isTracking ? "Aktiv" : "Gestoppt"}
            </Badge>
            {isAtHome !== null && (
              <Badge variant={isAtHome ? "default" : "secondary"}>
                {isAtHome ? "Zuhause" : "Unterwegs"}
              </Badge>
            )}
            <Badge variant={hasPermissions ? "default" : "destructive"}>
              {hasPermissions ? "Berechtigung erteilt" : "Berechtigung fehlt"}
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
              <h4 className="font-medium">Aktuelle Position:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Breitengrad: {currentLocation.latitude.toFixed(6)}</div>
                <div>Längengrad: {currentLocation.longitude.toFixed(6)}</div>
                <div>Zeitstempel: {currentLocation.timestamp.toLocaleString('de-DE')}</div>
              </div>
            </div>
          )}

          {/* Home Location Info */}
          {homeLocation && (
            <div className="space-y-2">
              <h4 className="font-medium">Home-Standort:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Breitengrad: {homeLocation.latitude.toFixed(6)}</div>
                <div>Längengrad: {homeLocation.longitude.toFixed(6)}</div>
                <div>Radius: {homeLocation.radius}m</div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2">
            {!hasPermissions && (
              <Button onClick={requestPermissions} variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Berechtigung anfordern
              </Button>
            )}
            
            <Button onClick={getCurrentPosition} variant="outline">
              <MapPin className="h-4 w-4 mr-2" />
              Position abrufen
            </Button>

            {currentLocation && !homeLocation && (
              <Button onClick={() => setCurrentAsHome()} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Als Zuhause festlegen
              </Button>
            )}

            {!isTracking ? (
              <Button onClick={handleStartTracking}>
                <Play className="h-4 w-4 mr-2" />
                Tracking starten
              </Button>
            ) : (
              <Button onClick={() => stopTracking()} variant="outline">
                <Square className="h-4 w-4 mr-2" />
                Tracking stoppen
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