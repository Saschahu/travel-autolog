import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken, looksLikePublicToken } from '@/lib/mapboxToken';
import { useTranslation } from 'react-i18next';

type Props = { center?: [number, number]; zoom?: number; onReady?: () => void };

// Light structure types for Mapbox objects
interface MBMapLike {
  on: (event: string, handler: (evt: unknown) => void) => void;
  remove: () => void;
  easeTo: (options: { center: [number, number]; zoom: number; duration: number }) => void;
  getZoom: () => number;
}

interface MBErrorEvent {
  error?: {
    status?: number;
    message?: string;
  };
}

// Guards
function isMapLike(obj: unknown): obj is MBMapLike {
  return typeof obj === 'object' && obj !== null && 
    'on' in obj && 'remove' in obj && 'easeTo' in obj && 'getZoom' in obj;
}

function isErrorEvent(evt: unknown): evt is MBErrorEvent {
  return typeof evt === 'object' && evt !== null && 'error' in evt;
}

export default function MapView({ center, zoom = 14, onReady }: Props) {
  const { t } = useTranslation();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = getMapboxToken();

  // Memoize init options to avoid unnecessary re-renders
  const initOptions = useMemo(() => ({
    style: 'mapbox://styles/mapbox/streets-v12',
    center: center ?? [10.75, 59.91] as [number, number],
    zoom: center ? zoom : 12,
  }), [center, zoom]);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    if (!token) {
      setError(t('mapboxTokenMissing'));
      return;
    }
    if (!looksLikePublicToken(token)) {
      setError(t('mapboxTokenInvalid'));
      return;
    }

    mapboxgl.accessToken = token;

    try {
      const map = new mapboxgl.Map({
        container: hostRef.current,
        ...initOptions,
      });
      mapRef.current = map;

      map.on('error', (evt) => {
        if (isErrorEvent(evt)) {
          const status = evt.error?.status;
          const msg = evt.error?.message ?? '';
          if (status === 401 || status === 403 || /Unauthorized|Invalid|forbidden/i.test(msg)) {
            setError(t('mapboxTokenRejected'));
          }
        }
      });

      // Call onReady callback if provided
      onReady?.();

      return () => { map.remove(); mapRef.current = null; };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(`${t('mapboxInitError')}: ${message}`);
    }
  }, [initOptions, onReady, t, token]); // Fixed dependencies

  useEffect(() => {
    if (!mapRef.current || !center) return;
    const [lng, lat] = center;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    mapRef.current.easeTo({ center, zoom: Math.max(mapRef.current.getZoom(), zoom), duration: 400 });
    if (!markerRef.current) markerRef.current = new mapboxgl.Marker({ color: '#1d4ed8' });
    markerRef.current.setLngLat(center).addTo(mapRef.current);
  }, [center, zoom]);

  if (error) return <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>;
  if (!token) return <div className="p-3 rounded bg-yellow-50 text-yellow-900 text-sm">{t('mapboxTokenMissingShort')}</div>;
  return <div ref={hostRef} className="w-full h-[420px] rounded" />;
}