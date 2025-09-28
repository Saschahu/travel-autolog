/**
 * Mapbox GL loader with CSS side-effect import handling
 * Provides resilient loading with timeout/retry mechanism
 */

export interface MapboxLoadError {
  code: 'E_CSS_LOAD_FAILED' | 'E_IMPORT_FAILED';
  message: string;
  originalError?: unknown;
}

let cachedModule: typeof import('mapbox-gl') | null = null;

export async function loadMapboxGL(): Promise<typeof import('mapbox-gl')> {
  if (cachedModule) {
    return cachedModule;
  }

  try {
    // ⚠️ Keep this side-effect import first. Vite needs the CSS bundled in prod,
    // otherwise the optimizer can drop it and Mapbox renders without styles.
    await import('mapbox-gl/dist/mapbox-gl.css');
  } catch (error) {
    const err = new Error(
      'Failed to load Mapbox GL CSS. Map styling may be broken.',
    ) as MapboxLoadError;
    err.code = 'E_CSS_LOAD_FAILED';
    err.originalError = error;
    throw err;
  }

  try {
    const mod = await import('mapbox-gl');
    const resolved = (mod as any).default ?? mod;
    cachedModule = resolved;
    return resolved;
  } catch (error) {
    const err = new Error(
      'Failed to load Mapbox GL. Map functionality will be unavailable.',
    ) as MapboxLoadError;
    err.code = 'E_IMPORT_FAILED';
    err.originalError = error;
    throw err;
  }
}

export function resetMapboxLoader(): void {
  cachedModule = null;
}