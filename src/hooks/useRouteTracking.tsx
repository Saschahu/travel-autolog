// React hook for GPS route tracking functionality (separate from GPS events)
import { useState, useEffect, useRef } from 'react';
import { gpsTrackingService, TrackingStatus } from '@/services/gpsTrackingService';
import { DailyTrack } from '@/types/tracking';
import { formatDistance } from '@/lib/trackingGeo';

export interface UseRouteTrackingResult {
  // Status
  status: TrackingStatus;
  isTracking: boolean;
  error: string | null;

  // Track data
  todaysTrack: DailyTrack | null;
  pointCount: number;
  distance: string;
  distanceMeters: number;

  // Controls
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  toggleTracking: () => Promise<void>;
  clearError: () => void;

  // Export functions
  exportGPX: () => Promise<void>;
  exportGeoJSON: () => Promise<void>;
  
  // Maintenance
  cleanupOldTracks: (days?: number) => Promise<number>;
}

export function useRouteTracking(): UseRouteTrackingResult {
  const [status, setStatus] = useState<TrackingStatus>('stopped');
  const [error, setError] = useState<string | null>(null);
  const [todaysTrack, setTodaysTrack] = useState<DailyTrack | null>(null);
  const initRef = useRef(false);

  // Load today's track on mount
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      loadTodaysTrack();
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleStatusChange = (newStatus: TrackingStatus) => {
      setStatus(newStatus);
      if (newStatus === 'error') {
        // Error will be handled by onError callback
      } else {
        setError(null);
      }
    };

    const handleTrackUpdate = (track: DailyTrack) => {
      setTodaysTrack(track);
    };

    const handleError = (errorMessage: string) => {
      setError(errorMessage);
    };

    gpsTrackingService.onStatusChanged(handleStatusChange);
    gpsTrackingService.onTrackUpdated(handleTrackUpdate);
    gpsTrackingService.onErrorOccurred(handleError);

    // Initialize status
    setStatus(gpsTrackingService.getStatus());

    // Cleanup function would go here if the service supported it
    return () => {
      // No cleanup needed for now since service doesn't support removing listeners
    };
  }, []);

  const loadTodaysTrack = async () => {
    try {
      const track = await gpsTrackingService.getTodaysTrack();
      setTodaysTrack(track);
    } catch (error) {
      console.error('Failed to load today\'s track:', error);
    }
  };

  const startTracking = async () => {
    try {
      setError(null);
      await gpsTrackingService.startTracking();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start tracking');
    }
  };

  const stopTracking = () => {
    gpsTrackingService.stopTracking();
  };

  const toggleTracking = async () => {
    if (status === 'active') {
      stopTracking();
    } else {
      await startTracking();
    }
  };

  const clearError = () => {
    setError(null);
  };

  const exportGPX = async () => {
    if (!todaysTrack || todaysTrack.points.length === 0) {
      setError('No track data to export');
      return;
    }

    try {
      // Dynamic import to avoid bundling if not used
      const { createGPXBlob, getGPXFilename } = await import('@/lib/export/gpx');
      const blob = createGPXBlob(todaysTrack);
      const filename = getGPXFilename(todaysTrack.date);

      // Create download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to export GPX');
    }
  };

  const exportGeoJSON = async () => {
    if (!todaysTrack || todaysTrack.points.length === 0) {
      setError('No track data to export');
      return;
    }

    try {
      // Dynamic import to avoid bundling if not used
      const { createGeoJSONBlob, getGeoJSONFilename } = await import('@/lib/export/geojson');
      const blob = createGeoJSONBlob(todaysTrack);
      const filename = getGeoJSONFilename(todaysTrack.date);

      // Create download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to export GeoJSON');
    }
  };

  const cleanupOldTracks = async (days: number = 60): Promise<number> => {
    try {
      return await gpsTrackingService.cleanupOldTracks(days);
    } catch (error) {
      setError('Failed to cleanup old tracks');
      return 0;
    }
  };

  const isTracking = status === 'active';
  const pointCount = todaysTrack?.points.length || 0;
  const distanceMeters = todaysTrack?.distanceM || 0;
  const distance = formatDistance(distanceMeters);

  return {
    status,
    isTracking,
    error,
    todaysTrack,
    pointCount,
    distance,
    distanceMeters,
    startTracking,
    stopTracking,
    toggleTracking,
    clearError,
    exportGPX,
    exportGeoJSON,
    cleanupOldTracks,
  };
}