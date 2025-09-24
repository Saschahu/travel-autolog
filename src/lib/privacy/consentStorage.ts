import { get, set } from 'idb-keyval';
import { Preferences } from '@capacitor/preferences';

export type ConsentStatus = 'accepted' | 'declined' | 'unset';

export interface TelemetryConsent {
  status: ConsentStatus;
  timestamp: string;
  version: string; // For future consent version tracking
}

const CONSENT_KEY = 'telemetryConsent';
const CONSENT_VERSION = '1.0';

/**
 * Get the current telemetry consent status
 */
export async function getConsentStatus(): Promise<ConsentStatus> {
  try {
    // Try IndexedDB first
    const consent = await get(CONSENT_KEY) as TelemetryConsent | undefined;
    if (consent?.status) {
      return consent.status;
    }

    // Fallback to Capacitor Preferences
    try {
      const result = await Preferences.get({ key: CONSENT_KEY });
      if (result.value) {
        const parsed = JSON.parse(result.value) as TelemetryConsent;
        return parsed.status || 'unset';
      }
    } catch (e) {
      console.warn('Failed to read consent from Capacitor Preferences:', e);
    }

    // Final fallback to localStorage
    const localConsent = localStorage.getItem(CONSENT_KEY);
    if (localConsent) {
      const parsed = JSON.parse(localConsent) as TelemetryConsent;
      return parsed.status || 'unset';
    }

    return 'unset';
  } catch (error) {
    console.error('Error reading consent status:', error);
    return 'unset';
  }
}

/**
 * Set the telemetry consent status
 */
export async function setConsentStatus(status: ConsentStatus): Promise<void> {
  const consent: TelemetryConsent = {
    status,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION
  };

  const serialized = JSON.stringify(consent);

  try {
    // Store in IndexedDB
    await set(CONSENT_KEY, consent);

    // Store in Capacitor Preferences
    try {
      await Preferences.set({
        key: CONSENT_KEY,
        value: serialized
      });
    } catch (e) {
      console.warn('Failed to store consent in Capacitor Preferences:', e);
    }

    // Store in localStorage as final fallback
    localStorage.setItem(CONSENT_KEY, serialized);

    console.log('Consent status updated:', status);
  } catch (error) {
    console.error('Error storing consent status:', error);
    throw error;
  }
}

/**
 * Check if user has given consent for telemetry
 */
export async function hasConsentForTelemetry(): Promise<boolean> {
  const status = await getConsentStatus();
  return status === 'accepted';
}

/**
 * Check if consent dialog should be shown (consent is unset)
 */
export async function shouldShowConsentDialog(): Promise<boolean> {
  const status = await getConsentStatus();
  return status === 'unset';
}

/**
 * Reset consent to unset (used when deleting all app data)
 */
export async function resetConsent(): Promise<void> {
  await setConsentStatus('unset');
}