// Geolocation utilities for home geofence functionality

export interface GeofencePosition {
  latitude: number;
  longitude: number;
  radius: number; // in meters
}

export interface GeofenceState {
  homePosition?: GeofencePosition;
  isAtHome: boolean;
  lastPosition?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
}

const STORAGE_KEY = 'home-geofence-settings';

// Haversine formula to calculate distance between two points
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const isInsideGeofence = (
  currentLat: number,
  currentLon: number,
  geofence: GeofencePosition
): boolean => {
  const distance = calculateDistance(
    currentLat,
    currentLon,
    geofence.latitude,
    geofence.longitude
  );
  return distance <= geofence.radius;
};

export const saveHomeGeofence = (position: GeofencePosition): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
  } catch (error) {
    console.error('Failed to save home geofence:', error);
  }
};

export const loadHomeGeofence = (): GeofencePosition | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate the data
      if (
        typeof parsed.latitude === 'number' &&
        typeof parsed.longitude === 'number' &&
        typeof parsed.radius === 'number'
      ) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load home geofence:', error);
  }
  return null;
};

export const clearHomeGeofence = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear home geofence:', error);
  }
};

export const getCurrentPosition = (options?: PositionOptions): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation wird von diesem Browser nicht unterstützt'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
        ...options
      }
    );
  });
};

export const watchPosition = (
  callback: (position: GeolocationPosition) => void,
  errorCallback?: (error: GeolocationPositionError) => void,
  options?: PositionOptions
): number | null => {
  if (!navigator.geolocation) {
    console.error('Geolocation is not supported');
    return null;
  }

  return navigator.geolocation.watchPosition(
    callback,
    errorCallback,
    {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 60000,
      ...options
    }
  );
};

export const clearWatch = (watchId: number): void => {
  if (navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

export const formatCoordinates = (lat: number, lon: number): string => {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
};

// Geofence status checker
export class GeofenceMonitor {
  private homePosition: GeofencePosition | null = null;
  private watchId: number | null = null;
  private listeners: ((isAtHome: boolean, distance?: number) => void)[] = [];

  constructor() {
    this.homePosition = loadHomeGeofence();
  }

  setHome(position: GeofencePosition): void {
    this.homePosition = position;
    saveHomeGeofence(position);
  }

  getHome(): GeofencePosition | null {
    return this.homePosition;
  }

  clearHome(): void {
    this.homePosition = null;
    clearHomeGeofence();
    this.stopWatching();
  }

  onStatusChange(callback: (isAtHome: boolean, distance?: number) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (isAtHome: boolean, distance?: number) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  startWatching(): boolean {
    if (!this.homePosition || this.watchId !== null) return false;

    this.watchId = watchPosition(
      (position) => {
        if (this.homePosition) {
          const distance = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            this.homePosition.latitude,
            this.homePosition.longitude
          );
          
          const isAtHome = distance <= this.homePosition.radius;
          
          this.listeners.forEach(callback => {
            callback(isAtHome, distance);
          });
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );

    return this.watchId !== null;
  }

  stopWatching(): void {
    if (this.watchId !== null) {
      clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  isWatching(): boolean {
    return this.watchId !== null;
  }
}