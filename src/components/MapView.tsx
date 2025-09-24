import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken, looksLikePublicToken } from '@/lib/mapboxToken';
import { useTranslation } from 'react-i18next';

type Props = { center?: [number, number]; zoom?: number };

// Type guards and helpers
type MBMapLike = { remove: () => void; on: (event: string, handler: (evt: unknown) => void) => void };
type MBGeoJSONSourceLike = { setData: (data: unknown) => void };

const isMapLike = (obj: unknown): obj is MBMapLike => {
  return obj != null && typeof obj === 'object' && 'remove' in obj && 'on' in obj;
};

const asGeoSource = (source: unknown): MBGeoJSONSourceLike | null => {
  return source != null && typeof source === 'object' && 'setData' in source 
    ? source as MBGeoJSONSourceLike 
    : null;
};

export default function MapView({ center, zoom = 14 }: Props) {
  const { t } = useTranslation();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = getMapboxToken();

  // Memoize init options to avoid unnecessary re-renders  
  const initOptions = useMemo(() => ({
    token,
    center: center ?? [10.75, 59.91],
    zoom: center ? zoom : 12,
  }), [token, center, zoom]);

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    if (!initOptions.token) {
      setError(t('mapboxTokenMissing'));
      return;
    }
    if (!looksLikePublicToken(initOptions.token)) {
      setError(t('mapboxTokenInvalid'));
      return;
    }

    mapboxgl.accessToken = initOptions.token;

    try {
      const map = new mapboxgl.Map({
        container: hostRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initOptions.center,
        zoom: initOptions.zoom,
      });
      mapRef.current = map;

      map.on('error', (evt: unknown) => {
        const error = evt && typeof evt === 'object' && 'error' in evt ? evt.error : null;
        const status = error && typeof error === 'object' && 'status' in error ? error.status : null;
        const message = error && typeof error === 'object' && 'message' in error 
          ? String(error.message) 
          : '';
        if (status === 401 || status === 403 || /Unauthorized|Invalid|forbidden/i.test(message)) {
          setError(t('mapboxTokenRejected'));
        }
      });

      return () => { map.remove(); mapRef.current = null; };
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e ? String(e.message) : String(e);
      setError(`${t('mapboxInitError')}: ${message}`);
    }
  }, [initOptions, t]); // depend on memoized options

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