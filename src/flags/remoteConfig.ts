// Remote Config Module
import { FLAG_REGISTRY, type FlagKey, type FlagValue, applyRemoteConfig } from './flags';

export interface RemoteConfigResponse {
  flags?: Record<string, any>;
  version?: string;
  timestamp?: number;
}

// Get the configured remote URL
function getConfigUrl(): string | null {
  return import.meta.env.VITE_CONFIG_URL || null;
}

// Validate remote config schema
function validateRemoteConfig(data: any): Record<FlagKey, FlagValue> | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  
  const flags = data.flags;
  if (!flags || typeof flags !== 'object') {
    return null;
  }
  
  const validatedFlags: Record<FlagKey, FlagValue> = {};
  
  // Only accept known flag keys
  for (const [key, value] of Object.entries(flags)) {
    if (key in FLAG_REGISTRY) {
      const flagDef = FLAG_REGISTRY[key];
      const defaultType = typeof flagDef.default;
      
      // Validate type matches expected type
      if (typeof value === defaultType) {
        validatedFlags[key] = value as FlagValue;
      } else {
        console.warn(`Invalid type for flag ${key}: expected ${defaultType}, got ${typeof value}`);
      }
    } else {
      console.warn(`Unknown flag key ignored: ${key}`);
    }
  }
  
  return validatedFlags;
}

// Check if cached config is stale
export function isStale(maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
  try {
    const lastFetch = localStorage.getItem('travel_flags_last_fetch');
    if (!lastFetch) return true;
    
    const lastFetchTime = parseInt(lastFetch, 10);
    return Date.now() - lastFetchTime > maxAgeMs;
  } catch {
    return true;
  }
}

// Fetch remote configuration
export async function fetchRemoteConfig(): Promise<boolean> {
  const configUrl = getConfigUrl();
  
  if (!configUrl) {
    console.info('VITE_CONFIG_URL not configured, skipping remote config fetch');
    return false;
  }
  
  try {
    console.info('Fetching remote config from:', configUrl);
    
    const response = await fetch(configUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-store'
      },
      // Privacy-safe: no credentials, no cookies
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }
    
    const data: RemoteConfigResponse = await response.json();
    const validatedFlags = validateRemoteConfig(data);
    
    if (!validatedFlags) {
      throw new Error('Invalid remote config format');
    }
    
    console.info('Remote config validated, applying flags:', Object.keys(validatedFlags));
    
    // Apply the remote config
    await applyRemoteConfig(validatedFlags);
    
    // Update last fetch timestamp
    try {
      localStorage.setItem('travel_flags_last_fetch', Date.now().toString());
    } catch (error) {
      console.warn('Failed to update last fetch timestamp:', error);
    }
    
    return true;
    
  } catch (error) {
    console.error('Failed to fetch remote config:', error);
    return false;
  }
}

// Get last fetch timestamp
export function getLastFetchTime(): number | null {
  try {
    const lastFetch = localStorage.getItem('travel_flags_last_fetch');
    return lastFetch ? parseInt(lastFetch, 10) : null;
  } catch {
    return null;
  }
}

// Format last fetch time for display
export function formatLastFetchTime(): string {
  const lastFetch = getLastFetchTime();
  if (!lastFetch) return 'Never';
  
  const date = new Date(lastFetch);
  return date.toLocaleString();
}