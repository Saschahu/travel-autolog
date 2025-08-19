import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = (import.meta as any).env.VITE_MAPBOX_TOKEN as string;

export default function MapView() {
  const el = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const geoControlRef = useRef<mapboxgl.GeolocateControl | null>(null);

  useEffect(() => {
    if (!el.current || mapRef.current) return;
    if (!mapboxgl.accessToken || mapboxgl.accessToken.includes('XXXXXXXXXXXXXXXXXXXX')) {
      // Zeige Hinweis im UI, keine Karte initialisieren
      return;
    }
    
    try {
      mapRef.current = new mapboxgl.Map({
        container: el.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [10.75, 59.91], // Oslo (neutraler Default)
        zoom: 12,
      });

      // Add GeolocateControl for user location
      const geo = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
        fitBoundsOptions: { maxZoom: 15 }
      });
      geoControlRef.current = geo;
      mapRef.current.addControl(geo, 'top-right');

      // Center map on first geolocate event
      geo.once('geolocate', (e: GeolocationPosition) => {
        const { longitude: lng, latitude: lat } = e.coords;
        mapRef.current?.easeTo({ center: [lng, lat], zoom: 14 });
      });

      // Trigger geolocation automatically after map loads
      mapRef.current.on('load', () => {
        setTimeout(() => geo.trigger(), 300);
      });
    } catch (error) {
      console.error('Mapbox initialization failed:', error);
    }

    return () => mapRef.current?.remove();
  }, []);

  const handleRecenter = () => {
    geoControlRef.current?.trigger();
  };

  if (!mapboxgl.accessToken || mapboxgl.accessToken.includes('XXXXXXXXXXXXXXXXXXXX')) {
    return (
      <div className="p-3 rounded bg-yellow-50 text-yellow-900 text-sm">
        <strong>Mapbox-Token fehlt oder ist ungültig.</strong>
        <br />
        Hole dir einen echten Token von <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a> und füge ihn in die <code>.env</code> ein:
        <pre className="mt-2">VITE_MAPBOX_TOKEN=dein_echter_token_hier</pre>
        Danach App neu starten.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Karte</h2>
        <button 
          onClick={handleRecenter}
          className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          Position abrufen
        </button>
      </div>
      <div id="gps-map" ref={el} className="w-full h-[420px] rounded" />
    </div>
  );
}