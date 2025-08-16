import React, { useEffect, useRef } from 'react';
// @ts-ignore - mapbox types might not be available yet
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl';
import { MapPin, Home, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;

export const LocationMap: React.FC<LocationMapProps> = ({
  currentLocation,
  homeLocation,
  jobLocations = [],
  className = "h-[400px] w-full"
}) => {
  const mapRef = useRef();

  // Fallback center point (Deutschland)
  const centerLat = currentLocation?.latitude || homeLocation?.latitude || 51.1657;
  const centerLng = currentLocation?.longitude || homeLocation?.longitude || 10.4515;

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      console.warn('Mapbox Token fehlt. Bitte MAPBOX_PUBLIC_TOKEN in den Secrets hinterlegen.');
    }
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Standortkarte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Mapbox Token erforderlich für Kartenanzeige
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
            mapboxAccessToken={MAPBOX_TOKEN}
            initialViewState={{
              longitude: centerLng,
              latitude: centerLat,
              zoom: 12
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
                <span>Aufträge ({jobLocations.length})</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};