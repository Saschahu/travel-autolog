// GPS tracking service for route recording
import { GeolocationService } from './geolocationService';
import { trackingStore } from '@/state/trackingStore';
import { TrackPoint, DailyTrack } from '@/types/tracking';
import { LocationData } from '@/types/gps-events';
import { GPSSettings, defaultGPSSettings } from '@/types/gps';

export type TrackingStatus = 'stopped' | 'starting' | 'active' | 'error';

export class GPSTrackingService {
  private geolocationService: GeolocationService;
  private status: TrackingStatus = 'stopped';
  private onStatusChange?: (status: TrackingStatus) => void;
  private onTrackUpdate?: (track: DailyTrack) => void;
  private onError?: (error: string) => void;

  constructor() {
    const trackingSettings: GPSSettings = {
      ...defaultGPSSettings,
      capture: {
        accuracyThreshold: 50,
        samplingInterval: 10,
      },
      enabled: true,
    };

    this.geolocationService = new GeolocationService(
      trackingSettings,
      this.handleLocationUpdate.bind(this),
      this.handleLocationError.bind(this)
    );
  }

  private handleLocationUpdate(location: LocationData): void {
    const trackPoint: TrackPoint = {
      lat: location.latitude,
      lng: location.longitude,
      t: location.timestamp.getTime(),
      acc: location.accuracy,
    };

    // Append to today's track with filtering
    trackingStore.appendTodayPoint(trackPoint).then((track) => {
      if (track && this.onTrackUpdate) {
        this.onTrackUpdate(track);
      }
    }).catch((error) => {
      console.error('Failed to append track point:', error);
      this.handleError('Failed to save GPS point');
    });
  }

  private handleLocationError(error: unknown): void {
    console.error('GPS tracking error:', error);
    this.setStatus('error');
    this.handleError('GPS location error');
  }

  private handleError(message: string): void {
    if (this.onError) {
      this.onError(message);
    }
  }

  private setStatus(status: TrackingStatus): void {
    this.status = status;
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  async startTracking(): Promise<boolean> {
    if (this.status === 'active') return true;

    this.setStatus('starting');
    
    try {
      // Check and request permissions
      const hasPermissions = await this.geolocationService.checkPermissions();
      if (!hasPermissions) {
        const granted = await this.geolocationService.requestPermissions();
        if (!granted) {
          this.setStatus('error');
          this.handleError('GPS permissions required');
          return false;
        }
      }

      // Start location tracking
      const started = await this.geolocationService.startTracking();
      if (started) {
        this.setStatus('active');
        
        // Cleanup old tracks on start
        trackingStore.cleanupOldTracks().catch(console.error);
        
        return true;
      } else {
        this.setStatus('error');
        this.handleError('Failed to start GPS tracking');
        return false;
      }
    } catch (error) {
      console.error('Failed to start tracking:', error);
      this.setStatus('error');
      this.handleError('Failed to start GPS tracking');
      return false;
    }
  }

  stopTracking(): void {
    this.geolocationService.stopTracking();
    this.setStatus('stopped');
  }

  getStatus(): TrackingStatus {
    return this.status;
  }

  isTracking(): boolean {
    return this.status === 'active';
  }

  async getTodaysTrack(): Promise<DailyTrack | null> {
    return trackingStore.loadTodaysTrack();
  }

  onStatusChanged(callback: (status: TrackingStatus) => void): void {
    this.onStatusChange = callback;
  }

  onTrackUpdated(callback: (track: DailyTrack) => void): void {
    this.onTrackUpdate = callback;
  }

  onErrorOccurred(callback: (error: string) => void): void {
    this.onError = callback;
  }

  async cleanupOldTracks(days: number = 60): Promise<number> {
    return trackingStore.cleanupOldTracks(days);
  }
}

// Global instance
export const gpsTrackingService = new GPSTrackingService();