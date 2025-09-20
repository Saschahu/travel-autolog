import { Capacitor } from '@capacitor/core';
import type { Position } from '@capacitor/geolocation';
import { Geolocation } from '@capacitor/geolocation';

export type Fix = {
  lat: number; lng: number; accuracy?: number | null; speed?: number | null; ts: number;
};

const OPTS = { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 } as const;

export async function requestPermission(): Promise<'granted'|'denied'|'prompt'> {
  if (Capacitor.isNativePlatform()) {
    const s = await Geolocation.checkPermissions();
    if (s.location === 'granted' || s.coarseLocation === 'granted') return 'granted';
    const r = await Geolocation.requestPermissions();
    return (r.location === 'granted' || r.coarseLocation === 'granted') ? 'granted' : 'denied';
  }
  return 'prompt'; // Web fragt bei erstem Aufruf
}

export async function getCurrent(): Promise<Fix> {
  if (Capacitor.isNativePlatform()) {
    const p = await Geolocation.getCurrentPosition(OPTS);
    return toFix(p);
  }
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('Geolocation nicht verfügbar'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(toFixWeb(p)),
      (e) => reject(e),
      OPTS
    );
  });
}

export type WatchHandle = { stop: () => Promise<void> | void };

export async function startWatch(
  onFix: (fix: Fix) => void,
  onError?: (err: any) => void
): Promise<WatchHandle> {
  if (Capacitor.isNativePlatform()) {
    const id = await Geolocation.watchPosition(OPTS, (pos, err) => {
      if (err) return onError?.(err);
      if (pos) onFix(toFix(pos));
    });
    return { stop: () => Geolocation.clearWatch({ id }) };
  }
  const id = navigator.geolocation.watchPosition(
    (p) => onFix(toFixWeb(p)),
    (e) => onError?.(e),
    OPTS
  );
  return { stop: () => navigator.geolocation.clearWatch(id) };
}

export function isSecureWebContext(): boolean {
  return typeof window !== 'undefined'
    && !Capacitor.isNativePlatform()
    && window.isSecureContext === true;
}

function toFix(p: Position): Fix {
  const { latitude, longitude, accuracy, speed } = p.coords;
  return { lat: latitude, lng: longitude, accuracy: accuracy ?? null, speed: speed ?? null, ts: p.timestamp };
}

function toFixWeb(p: GeolocationPosition): Fix {
  const { latitude, longitude, accuracy, speed } = p.coords;
  return { lat: latitude, lng: longitude, accuracy: accuracy ?? null, speed: speed ?? null, ts: p.timestamp };
}