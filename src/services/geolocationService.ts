import { LocationData } from '@/types/gps-events';
import { GPSSettings } from '@/types/gps';
import { Capacitor } from '@capacitor/core';

// Import Capacitor Geolocation for mobile
let CapacitorGeolocation: any;
if (!Capacitor.isNativePlatform()) {
  // Web fallback - use browser geolocation
} else {
  try {
    CapacitorGeolocation = require('@capacitor/geolocation').Geolocation;
  } catch (e) {
    console.warn('Capacitor Geolocation not available, using web fallback');
  }
}

export class GeolocationService {
  private watchId?: number;
  private settings: GPSSettings;
  private onLocationUpdate?: (location: LocationData) => void;
  private onError?: (error: string) => void;
  private isTracking = false;

  constructor(
    settings: GPSSettings,
    onLocationUpdate?: (location: LocationData) => void,
    onError?: (error: string) => void
  ) {
    this.settings = settings;
    this.onLocationUpdate = onLocationUpdate;
    this.onError = onError;
  }

  public updateSettings(settings: GPSSettings): void {
    this.settings = settings;
  }

  public async checkPermissions(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform() && CapacitorGeolocation) {
        const permissions = await CapacitorGeolocation.checkPermissions();
        return permissions.location === 'granted';
      } else {
        // Web fallback
        if (!navigator.geolocation) {
          this.onError?.('Geolocation wird von diesem Browser nicht unterstützt');
          return false;
        }

        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          return permission.state === 'granted';
        }
        
        // Fallback: try to get position to check permissions
        await this.getCurrentPosition();
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform() && CapacitorGeolocation) {
        const permissions = await CapacitorGeolocation.requestPermissions();
        return permissions.location === 'granted';
      } else {
        // Web fallback - try to get position to trigger permission request
        await this.getCurrentPosition();
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Permission denied';
      this.onError?.(`GPS-Berechtigung verweigert: ${message}`);
      return false;
    }
  }

  public async getCurrentPosition(): Promise<LocationData> {
    try {
      if (Capacitor.isNativePlatform() && CapacitorGeolocation) {
        const position = await CapacitorGeolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        });
        return this.transformCapacitorPosition(position);
      } else {
        // Web fallback
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation nicht verfügbar'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = this.transformPosition(position);
              resolve(location);
            },
            (error) => {
              reject(new Error(this.getGeolocationErrorMessage(error)));
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 5000
            }
          );
        });
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'GPS-Fehler');
    }
  }

  public async startTracking(): Promise<boolean> {
    if (this.isTracking) {
      return true;
    }

    try {
      // Check permissions first
      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        const granted = await this.requestPermissions();
        if (!granted) {
          return false;
        }
      }

      if (Capacitor.isNativePlatform() && CapacitorGeolocation) {
        // Use Capacitor for mobile
        this.watchId = await CapacitorGeolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: this.settings.capture.samplingInterval * 1000
          },
          (position: any, error: any) => {
            if (error) {
              this.onError?.(error.message || 'GPS tracking error');
              return;
            }

            const location = this.transformCapacitorPosition(position);
            
            // Filter by accuracy threshold
            if (location.accuracy > this.settings.capture.accuracyThreshold) {
              console.log(`Location filtered out due to poor accuracy: ${location.accuracy}m`);
              return;
            }

            this.onLocationUpdate?.(location);
          }
        );
      } else {
        // Web fallback
        if (!navigator.geolocation) {
          this.onError?.('Geolocation nicht verfügbar');
          return false;
        }

        this.watchId = navigator.geolocation.watchPosition(
          (position) => {
            const location = this.transformPosition(position);
            
            // Filter by accuracy threshold
            if (location.accuracy > this.settings.capture.accuracyThreshold) {
              console.log(`Location filtered out due to poor accuracy: ${location.accuracy}m`);
              return;
            }

            this.onLocationUpdate?.(location);
          },
          (error) => {
            this.onError?.(this.getGeolocationErrorMessage(error));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: this.settings.capture.samplingInterval * 1000
          }
        );
      }

      this.isTracking = true;
      console.log('GPS tracking started');
      return true;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.onError?.(`Fehler beim Starten des GPS-Trackings: ${message}`);
      return false;
    }
  }

  public stopTracking(): void {
    if (this.watchId !== undefined) {
      if (Capacitor.isNativePlatform() && CapacitorGeolocation) {
        CapacitorGeolocation.clearWatch({ id: this.watchId });
      } else {
        navigator.geolocation.clearWatch(this.watchId);
      }
      this.watchId = undefined;
    }
    
    this.isTracking = false;
    console.log('GPS tracking stopped');
  }

  public getIsTracking(): boolean {
    return this.isTracking;
  }

  private transformPosition(position: GeolocationPosition): LocationData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date(position.timestamp),
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading
    };
  }

  private transformCapacitorPosition(position: any): LocationData {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date(position.timestamp),
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading
    };
  }

  private getGeolocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'GPS-Berechtigung wurde verweigert';
      case error.POSITION_UNAVAILABLE:
        return 'Standortinformationen sind nicht verfügbar';
      case error.TIMEOUT:
        return 'GPS-Anfrage ist abgelaufen';
      default:
        return `GPS-Fehler: ${error.message}`;
    }
  }

  // Utility method for IP-based fallback location
  public async getLocationFromIP(): Promise<LocationData | null> {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: new Date(),
          accuracy: 10000, // IP location is very inaccurate
          speed: null,
          heading: null
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get IP location:', error);
      return null;
    }
  }
}