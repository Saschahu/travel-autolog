// IndexedDB storage for GPS tracking data
import { get, set, del, keys } from 'idb-keyval';
import { distanceMeters, haversine, todayLocalISO } from '@/lib/trackingGeo';
import type { DailyTrack, TrackPoint, TrackingConfig} from '@/types/tracking';
import { DEFAULT_TRACKING_CONFIG } from '@/types/tracking';

export class TrackingStore {
  private config: TrackingConfig = DEFAULT_TRACKING_CONFIG;

  async appendTodayPoint(point: TrackPoint): Promise<DailyTrack | null> {
    const today = todayLocalISO();
    const key = `track:${today}`;
    
    let track = await this.loadTrack(today);
    if (!track) {
      track = {
        date: today,
        points: [],
        distanceM: 0,
      };
    }

    const lastPoint = track.points[track.points.length - 1];
    
    // Apply filtering rules
    if (lastPoint) {
      const timeDelta = point.t - lastPoint.t;
      const distance = haversine(lastPoint, point);
      
      // Skip if too close in time and distance
      if (timeDelta < this.config.minIntervalMs && distance < this.config.minDistanceM) {
        return null;
      }
      
      // Skip if accuracy is too poor
      if ((point.acc ?? 0) > this.config.maxAccuracyM) {
        return null;
      }
      
      // Calculate speed to filter outliers
      const deltaTimeSeconds = Math.max(1, timeDelta / 1000);
      const speed = distance / deltaTimeSeconds;
      
      // Skip if distance is too small (micro-movement) or speed too high (outlier)
      if (distance < this.config.minSegmentM || speed > this.config.maxSpeedMs) {
        return null;
      }
    }

    // Add the point
    track.points.push(point);
    
    // Recalculate distance
    track.distanceM = distanceMeters(track.points);
    
    // Persist to IndexedDB
    await set(key, track);
    
    return track;
  }

  async loadTrack(date: string): Promise<DailyTrack | null> {
    try {
      const key = `track:${date}`;
      const track = await get(key);
      return track || null;
    } catch (error) {
      console.error('Failed to load track:', error);
      return null;
    }
  }

  async loadTodaysTrack(): Promise<DailyTrack | null> {
    return this.loadTrack(todayLocalISO());
  }

  async getAllTrackDates(): Promise<string[]> {
    try {
      const allKeys = await keys();
      return allKeys
        .filter((key) => typeof key === 'string' && key.startsWith('track:'))
        .map((key) => (key as string).replace('track:', ''))
        .sort();
    } catch (error) {
      console.error('Failed to get track dates:', error);
      return [];
    }
  }

  async deleteTrack(date: string): Promise<void> {
    try {
      const key = `track:${date}`;
      await del(key);
    } catch (error) {
      console.error('Failed to delete track:', error);
    }
  }

  async cleanupOldTracks(olderThanDays: number = this.config.autoCleanupDays): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      const cutoffDateStr = cutoffDate.toISOString().slice(0, 10);
      
      const dates = await this.getAllTrackDates();
      let deletedCount = 0;
      
      for (const date of dates) {
        if (date < cutoffDateStr) {
          await this.deleteTrack(date);
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old tracks:', error);
      return 0;
    }
  }

  updateConfig(newConfig: Partial<TrackingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): TrackingConfig {
    return { ...this.config };
  }
}

// Global instance
export const trackingStore = new TrackingStore();