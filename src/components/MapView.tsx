import React, { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken, looksLikePublicToken } from '@/lib/mapboxToken';
import { useTranslation } from 'react-i18next';

type MBMapLike = { on: (ev: string, cb: (...args: unknown[]) => void) => void; off: (ev: string, cb: (...args: unknown[]) => void) => void; addControl?: (c: unknown) => void; remove?: () => void; getSource?: (id: string) => unknown; }
type MBGeoJSONSourceLike = { setData: (d: unknown) => void }
function isMapLike(x: unknown): x is MBMapLike { return !!x && typeof (x as MBMapLike).on === 'function' && typeof (x as MBMapLike).off === 'function' }
function asGeoSource(x: unknown): MBGeoJSONSourceLike | null { return x && typeof (x as MBGeoJSONSourceLike).setData === 'function' ? (x as MBGeoJSONSourceLike) : null }

type Props = { center?: [number, number]; zoom?: number };

export default function MapView({ center, zoom = 14 }: Props) {
  const { t } = useTranslation();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MBMapLike | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
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

    mapboxgl.accessToken = token;

    try {
      const M = (mapboxgl as unknown as { Map: new (...a: unknown[]) => MBMapLike }).Map;
      const map = new M({
        container: hostRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: center ?? [10.75, 59.91],
        zoom: center ? zoom : 12,
      } as unknown);
      mapRef.current = map;

      map.on('error', (evt) => {
        const error = evt && typeof evt === 'object' && 'error' in evt ? evt.error : null;
        const status = error && typeof error === 'object' && 'status' in error ? error.status : null;
        const msg = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : '';
        if (status === 401 || status === 403 || /Unauthorized|Invalid|forbidden/i.test(msg)) {
          setError(t('mapboxTokenRejected'));
        }
      });

      return () => { if (map.remove) map.remove(); mapRef.current = null; };
    } catch (e: unknown) {
      const message = e && typeof e === 'object' && 'message' in e && typeof e.message === 'string' ? e.message : String(e);
      setError(`${t('mapboxInitError')}: ${message}`);
    }
  }, []); // init once

  useEffect(() => {
    if (!mapRef.current || !center) return;
    const [lng, lat] = center;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return;

    const m = mapRef.current;
    if (isMapLike(m)) {
      // Use type-safe easeTo if available, otherwise fall back to basic updates
      if ('easeTo' in m && typeof m.easeTo === 'function') {
        const mapWithEaseTo = m as { easeTo: (opts: unknown) => void; getZoom?: () => number };
        mapWithEaseTo.easeTo({ center, zoom: Math.max(mapWithEaseTo.getZoom?.() ?? zoom, zoom), duration: 400 });
      }
      
      const src = asGeoSource(m.getSource?.('route'));
      if (src) src.setData(null);
    }
    
    if (!markerRef.current) markerRef.current = new mapboxgl.Marker({ color: '#1d4ed8' });
    if (mapRef.current) {
      markerRef.current.setLngLat(center).addTo(mapRef.current as unknown as mapboxgl.Map);
    }
  }, [center, zoom]);

  if (error) return <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</div>;
  if (!token) return <div className="p-3 rounded bg-yellow-50 text-yellow-900 text-sm">{t('mapboxTokenMissingShort')}</div>;
  return <div ref={hostRef} className="w-full h-[420px] rounded" />;
}