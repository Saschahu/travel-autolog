import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Play, Square } from 'lucide-react';
import MapView from '@/components/MapView';
import { requestPermission, getCurrent, startWatch, isSecureWebContext, Fix, WatchHandle } from '@/services/geolocation';
import { Capacitor } from '@capacitor/core';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const GPSPage: React.FC = () => {
  const [center, setCenter] = useState<[number, number] | undefined>();
  const [msg, setMsg] = useState<string>();
  const [isTracking, setIsTracking] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const watchRef = useRef<WatchHandle | null>(null);

  useEffect(() => {
    (async () => {
      const perm = await requestPermission();
      if (perm === 'denied') {
        setMsg('Standortberechtigung abgelehnt. Bitte in den Systemeinstellungen erlauben.');
      }
      if (!Capacitor.isNativePlatform() && !isSecureWebContext()) {
        setMsg('Hinweis: Im Browser benötigt Geolocation HTTPS. Nutze eine https://-URL oder die installierte App.');
      }
    })();
    
    return () => { 
      watchRef.current?.stop(); 
    };
  }, []);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setMsg(undefined);
    try {
      const fix = await getCurrent();
      setCenter([fix.lng, fix.lat]); // Mapbox expects [lng, lat] format
      setMsg(`Position: ${fix.lat.toFixed(6)}, ${fix.lng.toFixed(6)} (±${fix.accuracy?.toFixed(0)}m)`);
    } catch (error: any) {
      setMsg('Standort konnte nicht ermittelt werden: ' + (error?.message ?? ''));
    } finally {
      setIsGettingLocation(false);
    }
  };

  const startTracking = async () => {
    setMsg(undefined);
    try {
      watchRef.current?.stop();
      watchRef.current = await startWatch(
        (fix: Fix) => {
          setCenter([fix.lng, fix.lat]);
          setMsg(`Tracking: ${fix.lat.toFixed(6)}, ${fix.lng.toFixed(6)} (±${fix.accuracy?.toFixed(0)}m)`);
          // TODO: hier deine FSM mit fix füttern
        }, 
        (err) => {
          setMsg('GPS-Fehler: ' + (err?.message ?? String(err)));
          setIsTracking(false);
        }
      );
      setIsTracking(true);
    } catch (error: any) {
      setMsg('Tracking konnte nicht gestartet werden: ' + (error?.message ?? ''));
    }
  };

  const stopTracking = () => {
    watchRef.current?.stop();
    setIsTracking(false);
    setMsg('Tracking gestoppt');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">GPS Tracking</h1>
        <div className="flex gap-2">
          <Button 
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            {isGettingLocation ? 'Wird abgerufen...' : 'Position'}
          </Button>
          
          {!isTracking ? (
            <Button 
              onClick={startTracking}
              className="flex items-center gap-2"
              size="sm"
            >
              <Play className="h-4 w-4" />
              Tracking starten
            </Button>
          ) : (
            <Button 
              onClick={stopTracking}
              variant="destructive"
              className="flex items-center gap-2"
              size="sm"
            >
              <Square className="h-4 w-4" />
              Tracking stoppen
            </Button>
          )}
        </div>
      </div>

      {msg && (
        <Alert className={msg.includes('Fehler') || msg.includes('abgelehnt') ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
          <AlertDescription className={msg.includes('Fehler') || msg.includes('abgelehnt') ? 'text-red-700' : 'text-blue-700'}>
            {msg}
          </AlertDescription>
        </Alert>
      )}
      
      <MapView center={center} />
      
      <div className="text-sm text-muted-foreground">
        <p><strong>Plattform:</strong> {Capacitor.isNativePlatform() ? 'Native App' : 'Web Browser'}</p>
        <p><strong>Secure Context:</strong> {isSecureWebContext() ? 'Ja' : 'Nein'}</p>
        <p><strong>Status:</strong> {isTracking ? 'Tracking aktiv' : 'Tracking inaktiv'}</p>
      </div>
    </div>
  );
};