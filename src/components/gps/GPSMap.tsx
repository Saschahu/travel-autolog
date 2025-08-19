import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export const GPSMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [error, setError] = useState<string>('');

  // Check for Mapbox token
  useEffect(() => {
    const envToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const storedToken = localStorage.getItem('mapbox_token');
    
    if (envToken) {
      setMapboxToken(envToken);
    } else if (storedToken) {
      setMapboxToken(storedToken);
    } else {
      setShowTokenInput(true);
      setError('VITE_MAPBOX_TOKEN ist nicht gesetzt. Bitte geben Sie Ihren Mapbox Public Token ein.');
    }
  }, []);

  // Initialize map when token is available
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [8.5417, 47.3769], // Switzerland center
        zoom: 7,
        pitch: 0,
        bearing: 0
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add geolocate control
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      
      map.current.addControl(geolocate, 'top-right');

      setError('');
      setShowTokenInput(false);

    } catch (err) {
      setError('Fehler beim Initialisieren der Karte. Überprüfen Sie Ihren Mapbox Token.');
      setShowTokenInput(true);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  const handleTokenSave = () => {
    if (mapboxToken.trim()) {
      localStorage.setItem('mapbox_token', mapboxToken.trim());
      setShowTokenInput(false);
      // Force re-initialization
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    }
  };

  if (showTokenInput || error) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Mapbox Token erforderlich
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="mapbox-token">
                Mapbox Public Token
              </Label>
              <Input
                id="mapbox-token"
                type="text"
                placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6InlvdXJfcHVibGljX3Rva2VuIn0..."
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
              />
              <div className="text-xs text-muted-foreground">
                Holen Sie sich Ihren kostenlosen Token von{' '}
                <a 
                  href="https://mapbox.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  mapbox.com
                </a>
              </div>
            </div>
            <Button onClick={handleTokenSave} className="w-full">
              Token speichern
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={mapContainer} 
        className="h-[400px] w-full rounded-lg overflow-hidden"
      />
      
      {/* Map overlay legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            <span>Aktuelle Position</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-muted-foreground rounded-full"></div>
            <span>Home-Bereich</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded-full"></div>
            <span>Kunde</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-secondary"></div>
            <span>Heutiger Pfad</span>
          </div>
        </div>
      </div>
    </div>
  );
};