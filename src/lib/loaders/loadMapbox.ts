/**
 * Dynamic Mapbox GL loader
 * Keeps Mapbox out of initial bundle for better performance
 */

let mapboxPromise: Promise<any> | null = null;

export async function loadMapbox() {
  if (mapboxPromise) {
    return mapboxPromise;
  }

  mapboxPromise = Promise.all([
    import('mapbox-gl'),
    import('mapbox-gl/dist/mapbox-gl.css')
  ]).then(([mapboxGl]) => {
    return mapboxGl;
  });

  return mapboxPromise;
}

export async function loadReactMapGL() {
  const mapboxModule = await loadMapbox();
  const reactMapGL = await import('react-map-gl');
  return { mapboxModule, ...reactMapGL };
}
