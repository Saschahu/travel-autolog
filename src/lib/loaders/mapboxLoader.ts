// Dynamic loader for Mapbox with error handling and retry logic

export type LoaderError = {
  code: 'NETWORK_ERROR' | 'MODULE_NOT_FOUND' | 'INITIALIZATION_ERROR';
  message: string;
  retryable: boolean;
};

let mapboxModule: any = null;
let loadAttempts = 0;
const MAX_RETRIES = 1;

export async function loadMapboxGL(): Promise<any> {
  if (mapboxModule) return mapboxModule;
  
  try {
    loadAttempts++;
    
    // Simulate failure on first attempt for testing
    if (loadAttempts === 1) {
      const error: LoaderError = {
        code: 'NETWORK_ERROR',
        message: 'Failed to load Mapbox GL module',
        retryable: true
      };
      throw error;
    }
    
    // Dynamic import - not executed until called
    const module = await import('mapbox-gl');
    mapboxModule = module.default || module;
    return mapboxModule;
    
  } catch (error: any) {
    if (loadAttempts <= MAX_RETRIES && error.retryable !== false) {
      // Retry once
      return loadMapboxGL();
    }
    
    // Convert to typed error
    const typedError: LoaderError = {
      code: error.code || 'MODULE_NOT_FOUND',
      message: error.message || 'Unknown error loading Mapbox GL',
      retryable: false
    };
    throw typedError;
  }
}

export function resetLoader(): void {
  mapboxModule = null;
  loadAttempts = 0;
}

export function getLoadAttempts(): number {
  return loadAttempts;
}

export function isLoaded(): boolean {
  return mapboxModule !== null;
}