// GeoJSON export functionality for GPS tracks
import { DailyTrack } from '@/types/tracking';

export function generateGeoJSON(track: DailyTrack): object {
  const coordinates = track.points.map(point => [
    point.lng,
    point.lat,
    point.t
  ]);

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: `ServiceTracker Route ${track.date}`,
          date: track.date,
          distance_meters: track.distanceM || 0,
          point_count: track.points.length,
          created: new Date().toISOString()
        },
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    ]
  };
}

export function getGeoJSONFilename(date: string): string {
  return `track_${date.replace(/-/g, '')}.geojson`;
}

export function createGeoJSONBlob(track: DailyTrack): Blob {
  const geoJsonContent = JSON.stringify(generateGeoJSON(track), null, 2);
  return new Blob([geoJsonContent], { type: 'application/geo+json' });
}