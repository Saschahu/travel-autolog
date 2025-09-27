// Remote Config Module – import-safe for Vitest
import {
  FLAG_REGISTRY,
  type FlagKey,
  type FlagValue,
  applyRemoteConfig as applyRemoteConfigToRegistry,
} from './flags';

export type RemoteConfigPayload = Partial<Record<FlagKey, FlagValue>>;

export interface RemoteConfigResponse {
  flags?: Record<string, unknown>;
  version?: string;
  timestamp?: number;
}

const LAST_FETCH_KEY = 'travel_flags_last_fetch';

/** Apply a remote payload into the registry (no IO here, just pure mutation). */
export async function applyRemoteConfig(payload: RemoteConfigPayload) {
  await applyRemoteConfigToRegistry(payload);
}

/** (Optional) helper that a caller can use to fetch + apply. Do NOT call on import. */
export async function fetchAndApplyRemoteConfig(
  fetcher: () => Promise<RemoteConfigPayload>,
) {
  const data = await fetcher();
  await applyRemoteConfig(data);
}

function getConfigUrl(): string | null {
  return import.meta.env?.VITE_CONFIG_URL || null;
}

function validateRemoteConfig(data: unknown): RemoteConfigPayload | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const maybeFlags = (data as RemoteConfigResponse).flags;
  if (!maybeFlags || typeof maybeFlags !== 'object') {
    return null;
  }

  const validated: RemoteConfigPayload = {};
  for (const [key, value] of Object.entries(maybeFlags)) {
    if (key in FLAG_REGISTRY) {
      const definition = FLAG_REGISTRY[key];
      if (typeof value === typeof definition.default) {
        validated[key as FlagKey] = value as FlagValue;
      } else {
        console.warn(
          `Invalid type for flag ${key}: expected ${typeof definition.default}, got ${typeof value}`,
        );
      }
    } else {
      console.warn(`Unknown flag key ignored: ${key}`);
    }
  }

  return validated;
}

export function isStale(maxAgeMs: number = 24 * 60 * 60 * 1000): boolean {
  try {
    const lastFetch = localStorage.getItem(LAST_FETCH_KEY);
    if (!lastFetch) return true;

    const lastFetchTime = parseInt(lastFetch, 10);
    return Number.isFinite(lastFetchTime)
      ? Date.now() - lastFetchTime > maxAgeMs
      : true;
  } catch {
    return true;
  }
}

export function getLastFetchTime(): number | null {
  try {
    const lastFetch = localStorage.getItem(LAST_FETCH_KEY);
    return lastFetch ? parseInt(lastFetch, 10) : null;
  } catch {
    return null;
  }
}

export function formatLastFetchTime(): string {
  const lastFetch = getLastFetchTime();
  if (!lastFetch) return 'Never';

  const date = new Date(lastFetch);
  return date.toLocaleString();
}

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
        Accept: 'application/json',
        'Cache-Control': 'no-store',
      },
      credentials: 'omit',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error(`Invalid content type: ${contentType}`);
    }

    const data = (await response.json()) as RemoteConfigResponse;
    const validated = validateRemoteConfig(data);

    if (!validated) {
      throw new Error('Invalid remote config format');
    }

    await applyRemoteConfig(validated);

    try {
      localStorage.setItem(LAST_FETCH_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Failed to update last fetch timestamp:', error);
    }

    return true;
  } catch (error) {
    console.error('Failed to fetch remote config:', error);
    return false;
  }
}
