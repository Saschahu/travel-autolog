import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MapPin, Play, Square } from 'lucide-react';
import MapView from '@/components/MapView';
import { requestPermission, getCurrent, startWatch, type Fix, type WatchHandle } from '@/services/geolocation';
import { Capacitor } from '@capacitor/core';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const GPSPage: React.FC = () => {
  const { t } = useTranslation();
  const [center, setCenter] = useState<[number, number]>();
  const [msg, setMsg] = useState<string>();
  const [isTracking, setIsTracking] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const watchRef = useRef<WatchHandle | null>(null);

  useEffect(() => {
    (async () => {
      const p = await requestPermission();
      if (p === 'denied') setMsg('Standortberechtigung abgelehnt. Bitte in den Systemeinstellungen erlauben.');
    })();
    return () => {
      if (watchRef.current) {
        watchRef.current.stop();
      }
    };
  }, []);

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    setMsg(undefined);
    try {
      const fix = await getCurrent();
      setCenter([fix.lng, fix.lat]); // Mapbox: [lng, lat]
      setMsg(undefined);
    } catch (error: unknown) {
      setMsg('Standort konnte nicht ermittelt werden. ' + (error instanceof Error ? error.message : ''));
    } finally {
      setIsGettingLocation(false);
    }
  };

  const startTracking = async () => {
    setMsg(undefined);
    try {
      watchRef.current?.stop();
      watchRef.current = await startWatch((fix: Fix) => {
        setCenter([fix.lng, fix.lat]);
        // TODO: FSM hier füttern (depart/arrive usw.)
      }, (err) => {
        setMsg('GPS-Fehler: ' + (err?.message ?? String(err)));
        setIsTracking(false);
      });
      setIsTracking(true);
    } catch (error: unknown) {
      setMsg(t('trackingCouldNotStart') + ' ' + (error instanceof Error ? error.message : ''));
    }
  };

  const stopTracking = () => {
    watchRef.current?.stop();
    setIsTracking(false);
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
              {t('startTracking')}
            </Button>
          ) : (
            <Button 
              onClick={stopTracking}
              variant="destructive"
              className="flex items-center gap-2"
              size="sm"
            >
              <Square className="h-4 w-4" />
              {t('stopTracking')}
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
      
      <div className="text-xs text-muted-foreground">
        Plattform: {Capacitor.getPlatform()} · Secure Context: {typeof window !== 'undefined' && window.isSecureContext ? 'Ja' : 'Nein'} · Status: {isTracking ? 'Tracking aktiv' : 'Tracking inaktiv'}
      </div>
    </div>
  );
};