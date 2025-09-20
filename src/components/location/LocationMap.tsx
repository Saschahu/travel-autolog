import { MapPin, Home, Clock } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
// @ts-expect-error - mapbox types might not be available yet
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

interface HomeLocation {
  latitude: number;
  longitude: number;
  radius: number;
}

interface LocationMapProps {
  currentLocation?: LocationData;
  homeLocation?: HomeLocation;
  jobLocations?: Array<{
    id: string;
    latitude: number;
    longitude: number;
    customerName: string;
    startDate: Date;
  }>;
  className?: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string;

export const LocationMap: React.FC<LocationMapProps> = ({
  currentLocation,
  homeLocation,
  jobLocations = [],
  className = "h-[400px] w-full"
}) => {
  const { t } = useTranslation();
  const mapRef = useRef();
  const [localToken, setLocalToken] = React.useState<string>('');
  const [showTokenInput, setShowTokenInput] = React.useState(false);
  
  // Check for token from environment or localStorage
  React.useEffect(() => {
    if (MAPBOX_TOKEN && MAPBOX_TOKEN !== 'pk.XXXXXXXXXXXXXXXXXXXX') {
      setLocalToken(MAPBOX_TOKEN);
      setShowTokenInput(false);
    } else {
      const stored = localStorage.getItem('mapbox_token');
      console.log('Gespeichertes Token gefunden:', stored ? stored.substring(0, 10) + '...' : 'keins');
      if (stored) {
        setLocalToken(stored);
        setShowTokenInput(false);
      } else {
        console.warn('Mapbox Token fehlt. Bitte .env-Datei konfigurieren.');
        setShowTokenInput(true);
      }
    }
  }, []);
  
  const handleTokenSave = () => {
    if (localToken.trim()) {
      localStorage.setItem('mapbox_token', localToken.trim());
      setShowTokenInput(false);
      console.log('Token gespeichert:', localToken.substring(0, 10) + '...');
    }
  };
  
  const activeToken = localToken;

  // Fallback center point (Deutschland)
  const centerLat = currentLocation?.latitude || homeLocation?.latitude || 51.1657;
  const centerLng = currentLocation?.longitude || homeLocation?.longitude || 10.4515;

  useEffect(() => {
    console.log('Active token check:', activeToken ? activeToken.substring(0, 10) + '...' : 'kein Token');
    if (!activeToken) {
      console.warn('Mapbox Token fehlt. Bitte Token eingeben.');
    }
  }, [activeToken]);

  // Auto-fit map to show all available pins
  useEffect(() => {
    const map = (mapRef.current as any);
    if (!map) return;

    const points: [number, number][] = [];
    if (currentLocation) points.push([currentLocation.longitude, currentLocation.latitude]);
    if (homeLocation) points.push([homeLocation.longitude, homeLocation.latitude]);
    if (jobLocations && jobLocations.length > 0) {
      jobLocations.forEach((j) => points.push([j.longitude, j.latitude]));
    }

    if (points.length === 0) return;

    if (points.length === 1) {
      map.flyTo({ center: points[0], zoom: 13, duration: 600 });
    } else {
      const lngs = points.map((p) => p[0]);
      const lats = points.map((p) => p[1]);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 60, maxZoom: 13, duration: 600 }
      );
    }
  }, [currentLocation, homeLocation, jobLocations]);

  if (!activeToken || showTokenInput) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Standortkarte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Geben Sie Ihr Mapbox Public Access Token ein (beginnt mit "pk."):
            </p>
            <div className="space-y-2">
              <Label htmlFor="mapbox-token">{t('mapboxPublicToken')}</Label>
              <Input
                id="mapbox-token"
                type="text"
                placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGo..."
                value={localToken}
                onChange={(e) => setLocalToken(e.target.value)}
              />
            </div>
            <Button onClick={handleTokenSave} disabled={!localToken.trim()}>
              Token speichern
            </Button>
            <p className="text-xs text-muted-foreground">
              <strong>Empfohlen:</strong> Token in .env-Datei setzen: <code>VITE_MAPBOX_TOKEN=ihr_token</code><br/>
              Alternativ wird Ihr Token dauerhaft im Browser gespeichert. Holen Sie sich Ihr Token von{' '}
              <a 
                href="https://account.mapbox.com/access-tokens/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Standortkarte
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-80 relative rounded-lg overflow-hidden">
          <Map
            ref={mapRef}
            mapboxAccessToken={activeToken}
            initialViewState={{
              longitude: centerLng,
              latitude: centerLat,
              zoom: 6
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
          >
            <NavigationControl position="top-right" />
            <GeolocateControl position="top-right" />

            {/* Aktuelle Position */}
            {currentLocation && (
              <Marker
                longitude={currentLocation.longitude}
                latitude={currentLocation.latitude}
                anchor="bottom"
              >
                <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                  <MapPin className="h-4 w-4" />
                </div>
              </Marker>
            )}

            {/* Home Location */}
            {homeLocation && (
              <Marker
                longitude={homeLocation.longitude}
                latitude={homeLocation.latitude}
                anchor="bottom"
              >
                <div className="bg-green-500 text-white p-2 rounded-full shadow-lg">
                  <Home className="h-4 w-4" />
                </div>
              </Marker>
            )}

            {/* Job Locations */}
            {jobLocations.map((job) => (
              <Marker
                key={job.id}
                longitude={job.longitude}
                latitude={job.latitude}
                anchor="bottom"
              >
                <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-600 transition-colors">
                  <Clock className="h-4 w-4" />
                </div>
              </Marker>
            ))}
          </Map>
        </div>
        
        {/* Legende */}
        <div className="p-4 border-t">
          <div className="flex flex-wrap gap-4 text-sm">
            {currentLocation && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span>Aktuelle Position</span>
              </div>
            )}
            {homeLocation && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Zuhause</span>
              </div>
            )}
            {jobLocations.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>{t('jobs')} ({jobLocations.length})</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};