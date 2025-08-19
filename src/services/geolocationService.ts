import { LocationData } from '@/types/gps-events';
import { GPSSettings } from '@/types/gps';

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
    if (!navigator.geolocation) {
      this.onError?.('Geolocation wird von diesem Browser nicht unterstützt');
      return false;
    }

    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return permission.state === 'granted';
      }
      
      // Fallback: try to get position to check permissions
      await this.getCurrentPosition();
      return true;
    } catch (error) {
      return false;
    }
  }

  public async requestPermissions(): Promise<boolean> {
    try {
      await this.getCurrentPosition();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Permission denied';
      this.onError?.(`GPS-Berechtigung verweigert: ${message}`);
      return false;
    }
  }

  public async getCurrentPosition(): Promise<LocationData> {
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

  public async startTracking(): Promise<boolean> {
    if (this.isTracking) {
      return true;
    }

    if (!navigator.geolocation) {
      this.onError?.('Geolocation nicht verfügbar');
      return false;
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
      navigator.geolocation.clearWatch(this.watchId);
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