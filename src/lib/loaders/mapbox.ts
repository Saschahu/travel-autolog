/**
 * Mapbox GL loader with CSS side-effect import handling
 * Provides resilient loading with timeout/retry mechanism
 */

export interface MapboxLoadError {
  code: 'E_IMPORT_TIMEOUT' | 'E_IMPORT_FAILED' | 'E_CSS_LOAD_FAILED';
  message: string;
  originalError?: unknown;
}

let mapboxModule: typeof import('mapbox-gl') | null = null;
let cssLoaded = false;

/**
 * Timeout+retry helper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  delay = 200
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      if (import.meta.env.DEV) {
        console.warn(`[mapbox-loader] Retrying after ${delay}ms...`, error);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, Math.min(delay * 1.5, 500));
    }
    throw error;
  }
}

/**
 * Load Mapbox CSS with error handling
 */
async function loadMapboxCSS(): Promise<void> {
  if (cssLoaded) return;

  try {
    await import('mapbox-gl/dist/mapbox-gl.css');
    cssLoaded = true;
  } catch (error) {
    const loadError: MapboxLoadError = {
      code: 'E_CSS_LOAD_FAILED',
      message: 'Failed to load Mapbox GL CSS. Map styling may be broken.',
      originalError: error
    };
    
    if (import.meta.env.DEV) {
      console.warn('[mapbox-loader] CSS load failed:', loadError);
    }
    
    throw loadError;
  }
}

/**
 * Load Mapbox GL JS module with timeout and retry
 */
export async function loadMapboxGL(): Promise<typeof import('mapbox-gl')> {
  if (mapboxModule) return mapboxModule;

  try {
    // Load CSS first
    await loadMapboxCSS();

    // Load the main module with retry
    mapboxModule = await withRetry(async () => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Import timeout')), 5000);
      });

      const importPromise = import('mapbox-gl');
      
      return Promise.race([importPromise, timeoutPromise]);
    });

    if (import.meta.env.DEV) {
      console.log('[mapbox-loader] Successfully loaded Mapbox GL');
    }

    return mapboxModule;
  } catch (error) {
    const loadError: MapboxLoadError = {
      code: error instanceof Error && error.message.includes('timeout') 
        ? 'E_IMPORT_TIMEOUT' 
        : 'E_IMPORT_FAILED',
      message: 'Failed to load Mapbox GL. Map functionality will be unavailable.',
      originalError: error
    };

    if (import.meta.env.DEV) {
      console.warn('[mapbox-loader] Module load failed:', loadError);
    }

    throw loadError;
  }
}

/**
 * Reset loader state (useful for testing)
 */
export function resetMapboxLoader(): void {
  mapboxModule = null;
  cssLoaded = false;
}