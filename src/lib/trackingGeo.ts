// Geolocation utilities for GPS tracking
import { TrackPoint } from '@/types/tracking';

const R = 6371000; // Earth's radius in meters

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (x: number) => x * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function distanceMeters(points: TrackPoint[]): number {
  if (points.length < 2) return 0;
  
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const current = points[i];
    
    // Skip points with poor accuracy
    if ((current.acc ?? 0) > 50) continue;
    
    const distance = haversine(prev, current);
    const deltaTime = Math.max(1, (current.t - prev.t) / 1000); // seconds
    const speed = distance / deltaTime; // m/s
    
    // Filter micro-movements and outliers
    if (distance < 5) continue;
    if (speed > 50) continue; // ~180 km/h max speed filter
    
    total += distance;
  }
  
  return total;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
}

export function todayLocalISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}