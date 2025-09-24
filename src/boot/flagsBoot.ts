// Feature Flags Boot Hook
import { initializeFlags } from '@/flags/flags';
import { fetchRemoteConfig, isStale } from '@/flags/remoteConfig';

// Boot the flags system
export async function bootFlags(): Promise<void> {
  console.info('Booting feature flags system...');
  
  try {
    // 1. Load cached flags first
    await initializeFlags();
    console.info('Feature flags initialized from cache');
    
    // 2. Check if we should fetch remote config
    const configUrl = import.meta.env.VITE_CONFIG_URL;
    
    if (!configUrl) {
      console.info('No VITE_CONFIG_URL configured, skipping remote config');
      return;
    }
    
    // 3. Check if we're online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.info('Offline, skipping remote config fetch');
      return;
    }
    
    // 4. Check if config is stale (24 hours by default)
    if (!isStale()) {
      console.info('Remote config is fresh, skipping fetch');
      return;
    }
    
    // 5. Fetch remote config opportunistically
    console.info('Fetching remote config...');
    const success = await fetchRemoteConfig();
    
    if (success) {
      console.info('Remote config fetched and applied successfully');
    } else {
      console.warn('Failed to fetch remote config, using cached flags');
    }
    
  } catch (error) {
    console.error('Error during flags boot:', error);
    // Don't throw - the app should continue even if flags fail
  }
}

// Call this from your app initialization
// This respects telemetry consent by design - no identifiers are ever sent