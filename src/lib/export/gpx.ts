// GPX export functionality for GPS tracks
import type { DailyTrack } from '@/types/tracking';

export function generateGPX(track: DailyTrack): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="ServiceTracker" 
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"
     xmlns="http://www.topografix.com/GPX/1/1" 
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <metadata>
    <name>Track ${track.date}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>ServiceTracker Route ${track.date}</name>
    <trkseg>`;

  const points = track.points.map(point => {
    const timestamp = new Date(point.t).toISOString();
    return `      <trkpt lat="${point.lat}" lon="${point.lng}">
        <time>${timestamp}</time>
      </trkpt>`;
  }).join('\n');

  const footer = `    </trkseg>
  </trk>
</gpx>`;

  return header + '\n' + points + '\n' + footer;
}

export function getGPXFilename(date: string): string {
  return `track_${date.replace(/-/g, '')}.gpx`;
}

export function createGPXBlob(track: DailyTrack): Blob {
  const gpxContent = generateGPX(track);
  return new Blob([gpxContent], { type: 'application/gpx+xml' });
}