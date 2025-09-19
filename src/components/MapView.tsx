import { useEffect, useRef, useState } from 'react';
import { getMapboxToken, looksLikePublicToken } from '@/lib/mapboxToken';
import { useTranslation } from 'react-i18next';
import { getMapboxGL } from '@/lib/loadMapbox';

type Props = { center?: [number, number]; zoom?: number };

export default function MapView({ center, zoom = 14 }: Props) {
  const { t } = useTranslation();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any | null>(null); // Changed from mapboxgl.Map to any to avoid import
  const markerRef = useRef<any | null>(null); // Changed from mapboxgl.Marker to any to avoid import
  const [error, setError] = useState<string | null>(null);

  const token = getMapboxToken();

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

    const initMap = async () => {
      try {
        const mapboxgl = await getMapboxGL();
        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: hostRef.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: center ?? [10.75, 59.91],
          zoom: center ? zoom : 12,
        });
        mapRef.current = map;

        map.on('error', (evt: any) => {
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
    };

    initMap();
  }, []); // init once

  useEffect(() => {
    if (!mapRef.current || !center) return;
    const [lng, lat] = center;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    const updateMap = async () => {
      try {
        const mapboxgl = await getMapboxGL();
        mapRef.current.easeTo({ center, zoom: Math.max(mapRef.current.getZoom(), zoom), duration: 400 });
        if (!markerRef.current) markerRef.current = new mapboxgl.Marker({ color: '#1d4ed8' });
        markerRef.current.setLngLat(center).addTo(mapRef.current);
      } catch (e: any) {
        console.error('Error updating map:', e);
      }
    };

    updateMap();
  }, [center, zoom]);

  if (error) return <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>;
  if (!token) return <div className="p-3 rounded bg-yellow-50 text-yellow-900 text-sm">{t('mapboxTokenMissingShort')}</div>;
  return <div ref={hostRef} className="w-full h-[420px] rounded" />;
}