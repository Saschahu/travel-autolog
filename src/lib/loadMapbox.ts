/**
 * Lazy loader for Mapbox GL library
 * This prevents mapbox-gl from being included in the initial bundle
 */
export async function loadMapbox() {
  const mapboxModule = await import('mapbox-gl');
  await import('mapbox-gl/dist/mapbox-gl.css');
  return mapboxModule.default;
}