import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = (import.meta as any).env.VITE_MAPBOX_TOKEN as string;

export default function MapView() {
  const el = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!el.current || mapRef.current) return;
    if (!mapboxgl.accessToken) {
      // Zeige Hinweis im UI, keine Karte initialisieren
      return;
    }
    mapRef.current = new mapboxgl.Map({
      container: el.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [10.75, 59.91], // Oslo (neutraler Default)
      zoom: 12,
    });
    return () => mapRef.current?.remove();
  }, []);

  if (!mapboxgl.accessToken) {
    return (
      <div className="p-3 rounded bg-yellow-50 text-yellow-900 text-sm">
        Mapbox-Token fehlt. Lege im Projektroot eine <code>.env</code> an mit
        <pre className="mt-2">VITE_MAPBOX_TOKEN=pk_...</pre>
        und setze im Build ein gleichnamiges Secret. Danach App neu starten.
      </div>
    );
  }

  return <div id="gps-map" ref={el} className="w-full h-[420px] rounded" />;
}