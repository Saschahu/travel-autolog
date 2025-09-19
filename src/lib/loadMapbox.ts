/**
 * Dynamic loader for mapbox-gl to prevent eager loading
 */

let mapboxGlModule: typeof import('mapbox-gl') | null = null;

export async function loadMapbox() {
  if (!mapboxGlModule) {
    mapboxGlModule = await import('mapbox-gl');
    // Also import CSS
    await import('mapbox-gl/dist/mapbox-gl.css');
  }
  return mapboxGlModule;
}

export async function getMapboxGL() {
  const module = await loadMapbox();
  return module.default;
}