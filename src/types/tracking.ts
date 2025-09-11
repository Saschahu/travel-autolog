// GPS tracking types for daily route recording
export interface TrackPoint {
  lat: number;
  lng: number;
  t: number;        // epoch ms
  acc?: number;     // accuracy (m)
}

export interface DailyTrack {
  date: string;     // YYYY-MM-DD (local TZ)
  points: TrackPoint[];
  distanceM?: number;   // cached sum in meters (optional)
}

export interface TrackingConfig {
  minIntervalMs: number;    // minimum time between points
  minDistanceM: number;     // minimum distance to record new point
  maxAccuracyM: number;     // max acceptable accuracy
  minSegmentM: number;      // ignore micro-movements
  maxSpeedMs: number;       // speed filter for outliers
  autoCleanupDays: number;  // auto-delete tracks older than X days
}

export const DEFAULT_TRACKING_CONFIG: TrackingConfig = {
  minIntervalMs: 10_000,    // 10s
  minDistanceM: 25,         // 25m
  maxAccuracyM: 50,         // 50m
  minSegmentM: 5,           // 5m
  maxSpeedMs: 50,           // ~180 km/h
  autoCleanupDays: 60,      // 60 days
};