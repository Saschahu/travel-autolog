import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken, looksLikePublicToken } from '@/lib/mapboxToken';

type Props = { center?: [number, number]; zoom?: number };

export default function MapView({ center, zoom = 14 }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = getMapboxToken();

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    if (!token) {
      setError('Kein Mapbox-Token gefunden. (Native: VITE_MAPBOX_TOKEN_MOBILE, Web: VITE_MAPBOX_TOKEN_WEB oder im GPS-UI speichern)');
      return;
    }
    if (!looksLikePublicToken(token)) {
      setError('Mapbox-Token ungültig (muss mit "pk." beginnen).');
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
          setError('Mapbox lehnt den Token ab (401/403). Für Web: Domain in URL-Restrictions. Für Native: separaten mobilen Token ohne URL-Restrictions nutzen.');
        }
      });

      return () => { map.remove(); mapRef.current = null; };
    } catch (e: any) {
      setError(`Fehler beim Initialisieren der Karte: ${e?.message ?? String(e)}`);
    }
  }, []); // init once

  useEffect(() => {
    if (!mapRef.current || !center) return;
    const [lng, lat] = center;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    mapRef.current.easeTo({ center, zoom: Math.max(mapRef.current.getZoom(), zoom), duration: 400 });
    if (!markerRef.current) markerRef.current = new mapboxgl.Marker({ color: '#1d4ed8' });
    markerRef.current.setLngLat(center).addTo(mapRef.current);
  }, [center, zoom]);

  if (error) return <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>;
  if (!token) return <div className="p-3 rounded bg-yellow-50 text-yellow-900 text-sm">Mapbox-Token fehlt.</div>;
  return <div ref={hostRef} className="w-full h-[420px] rounded" />;
}