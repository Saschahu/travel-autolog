import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type MapViewProps = {
  /** WICHTIG: [lng, lat] Reihenfolge */
  center?: [number, number];
  zoom?: number;
};

/** Token-Quelle: UI (LocalStorage) > .env (Vite) */
function getToken(): string | undefined {
  try {
    const uiToken = typeof window !== 'undefined'
      ? (localStorage.getItem('mapbox_token') || localStorage.getItem('MAPBOX_TOKEN') || '').trim()
      : '';
    if (uiToken) return uiToken;

    const envToken = (import.meta as any).env?.VITE_MAPBOX_TOKEN as string | undefined;
    return envToken?.trim();
  } catch {
    return undefined;
  }
}

/** einfacher Plausibilitätscheck (ersetzt keine Server-Validierung) */
function looksLikePublicToken(t?: string) {
  return !!t && /^pk\.[A-Za-z0-9._\-]{10,}$/.test(t);
}

export default function MapView({ center, zoom = 14 }: MapViewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = getToken();

  // Initialisierung
  useEffect(() => {
    if (!hostRef.current || mapRef.current) return;

    if (!token) {
      setError('Kein Mapbox-Token gefunden. Trage ihn im GPS-Tab ein (LocalStorage) oder setze VITE_MAPBOX_TOKEN in .env/CI.');
      return;
    }
    if (!looksLikePublicToken(token)) {
      setError('Mapbox-Token scheint ungültig (muss mit "pk." beginnen). Bitte echten Public Token eintragen.');
      return;
    }

    mapboxgl.accessToken = token;

    try {
      const map = new mapboxgl.Map({
        container: hostRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center ?? [10.75, 59.91], // Default: Oslo
        zoom: center ? zoom : 12,
      });
      mapRef.current = map;

      // Mapbox-Fehler (z. B. 401/403 bei ungültigem Token/fehlender URL-Restriction)
      map.on('error', (evt) => {
        const msg = (evt?.error as any)?.message ?? String(evt?.error ?? '');
        const status = (evt?.error as any)?.status;
        if (status === 401 || status === 403 || /Unauthorized|Invalid|forbidden/i.test(msg)) {
          setError('Mapbox lehnt den Token ab (401/403). Prüfe Token und URL-Restrictions im Mapbox-Dashboard.');
        }
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    } catch (e: any) {
      setError(`Fehler beim Initialisieren der Karte: ${e?.message ?? String(e)}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // nur einmal initialisieren

  // Recenter + Marker, wenn center-Prop sich ändert
  useEffect(() => {
    if (!mapRef.current || !center) return;
    const [lng, lat] = center;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    mapRef.current.easeTo({ center, zoom: Math.max(mapRef.current.getZoom(), zoom), duration: 400 });

    if (!markerRef.current) {
      markerRef.current = new mapboxgl.Marker({ color: '#1d4ed8' });
    }
    markerRef.current.setLngLat(center).addTo(mapRef.current);
  }, [center, zoom]);

  if (error) {
    return (
      <div className="p-3 rounded bg-red-50 text-red-700 text-sm">
        {error}
        <div className="mt-2 text-xs text-red-600/80">
          Hinweis: In Mapbox unter <b>Token restrictions → URL</b> die Origins
          <code className="ml-1">http://localhost:8080/*</code> und
          <code className="ml-1">http://127.0.0.1:8080/*</code> freigeben.
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="p-3 rounded bg-yellow-50 text-yellow-900 text-sm">
        Mapbox-Token fehlt. Trage ihn im GPS-Tab ein oder setze <code>VITE_MAPBOX_TOKEN</code> in <code>.env</code>.
      </div>
    );
  }

  return <div ref={hostRef} className="w-full h-[420px] rounded" />;
}