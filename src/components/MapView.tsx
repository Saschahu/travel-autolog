import { useEffect, useRef, useState } from 'react';
import { loadMapbox } from '@/lib/loaders/loadMapbox';
import { getMapboxToken, looksLikePublicToken } from '@/lib/mapboxToken';
import { useTranslation } from 'react-i18next';

type Props = { center?: [number, number]; zoom?: number };

export default function MapView({ center, zoom = 14 }: Props) {
  const { t } = useTranslation();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapboxgl, setMapboxgl] = useState<any>(null);

  const token = getMapboxToken();

  // Load Mapbox dynamically
  useEffect(() => {
    loadMapbox().then((mapboxModule) => {
      setMapboxgl(mapboxModule.default);
    }).catch((error) => {
      console.error('Failed to load Mapbox:', error);
      setError('Failed to load map library');
    });
  }, []);

  useEffect(() => {
    if (!hostRef.current || mapRef.current || !mapboxgl) return;

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
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center ?? [10.75, 59.91],
        zoom: center ? zoom : 12,
      });
      mapRef.current = map;

      map.on('error', (evt) => {
        const status = (evt?.error as any)?.status;
        const msg = (evt?.error as any)?.message ?? '';
        if (status === 401 || status === 403 || /Unauthorized|Invalid|forbidden/i.test(msg)) {
          setError(t('mapboxTokenRejected'));
        }
      });

      return () => { map.remove(); mapRef.current = null; };
    } catch (e: any) {
      setError(`${t('mapboxInitError')}: ${e?.message ?? String(e)}`);
    }
  }, [token, mapboxgl, t]); // Dependencies include dynamically loaded mapboxgl

  useEffect(() => {
    if (!mapRef.current || !center || !mapboxgl) return;
    const [lng, lat] = center;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    mapRef.current.easeTo({ center, zoom: Math.max(mapRef.current.getZoom(), zoom), duration: 400 });
    if (!markerRef.current) markerRef.current = new mapboxgl.Marker({ color: '#1d4ed8' });
    markerRef.current.setLngLat(center).addTo(mapRef.current);
  }, [center, zoom, mapboxgl]);

  if (error) return <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>;
  if (!token) return <div className="p-3 rounded bg-yellow-50 text-yellow-900 text-sm">{t('mapboxTokenMissingShort')}</div>;
  if (!mapboxgl) return <div className="w-full h-[420px] rounded bg-gray-100 flex items-center justify-center">
    <div className="text-gray-500">Loading map...</div>
  </div>;
  return <div ref={hostRef} className="w-full h-[420px] rounded" />;
}