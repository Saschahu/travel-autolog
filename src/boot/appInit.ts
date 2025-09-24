/**
 * Application initialization and migration logic
 * Handles setup of preferences store and legacy data migrations
 */

import { get, set, keys } from 'idb-keyval';
import { getConsentStatus, setConsentStatus } from '@/lib/privacy/consentStorage';
import { initializeMonitoring } from './monitoring';

const PREFERENCES_STORE_KEY = 'preferences';
const MIGRATION_VERSION_KEY = 'migration_version';
const CURRENT_MIGRATION_VERSION = 1;

export interface PreferencesStore {
  telemetryConsent?: 'accepted' | 'declined' | 'unset';
  migrationVersion?: number;
  // Other app preferences can be added here
}

/**
 * Initialize the app and run necessary migrations
 */
export async function initializeApp(): Promise<void> {
  console.log('App initialization starting...');
  
  try {
    // Ensure preferences store exists
    await ensurePreferencesStore();
    
    // Run migrations if needed
    await runMigrations();
    
    // Initialize monitoring based on consent
    const consentStatus = await getConsentStatus();
    const hasConsent = consentStatus === 'accepted';
    initializeMonitoring(hasConsent);
    
    console.log('App initialization completed successfully');
  } catch (error) {
    console.error('App initialization failed:', error);
    // Don't throw - app should still work even if init fails
  }
}

/**
 * Ensure the preferences store exists in IndexedDB
 */
async function ensurePreferencesStore(): Promise<void> {
  try {
    let preferences = await get(PREFERENCES_STORE_KEY) as PreferencesStore | undefined;
    
    if (!preferences) {
      preferences = {
        migrationVersion: CURRENT_MIGRATION_VERSION
      };
      await set(PREFERENCES_STORE_KEY, preferences);
      console.log('Created new preferences store');
    }
  } catch (error) {
    console.error('Failed to ensure preferences store:', error);
  }
}

/**
 * Run necessary data migrations
 */
async function runMigrations(): Promise<void> {
  try {
    const currentVersion = await getMigrationVersion();
    
    if (currentVersion < CURRENT_MIGRATION_VERSION) {
      console.log(`Running migrations from version ${currentVersion} to ${CURRENT_MIGRATION_VERSION}`);
      
      // Migration 1: Move any existing consent flags to new consent system
      if (currentVersion < 1) {
        await migrationV1();
      }
      
      // Update migration version
      await setMigrationVersion(CURRENT_MIGRATION_VERSION);
      console.log('Migrations completed successfully');
    }
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

/**
 * Migration V1: Initialize consent system and migrate any legacy flags
 */
async function migrationV1(): Promise<void> {
  console.log('Running migration V1: Initialize consent system');
  
  try {
    // Check if there are any legacy telemetry flags in localStorage
    const legacyTelemetryEnabled = localStorage.getItem('telemetry_enabled');
    const legacyAnalyticsEnabled = localStorage.getItem('analytics_enabled');
    
    if (legacyTelemetryEnabled !== null || legacyAnalyticsEnabled !== null) {
      // If any legacy flag was explicitly set to true, consider it accepted
      const wasAccepted = legacyTelemetryEnabled === 'true' || legacyAnalyticsEnabled === 'true';
      await setConsentStatus(wasAccepted ? 'accepted' : 'declined');
      
      // Clean up legacy flags
      localStorage.removeItem('telemetry_enabled');
      localStorage.removeItem('analytics_enabled');
      
      console.log('Migrated legacy telemetry flags to new consent system');
    }
    
    // Update preferences store
    const preferences = await get(PREFERENCES_STORE_KEY) as PreferencesStore || {};
    preferences.migrationVersion = 1;
    await set(PREFERENCES_STORE_KEY, preferences);
    
  } catch (error) {
    console.error('Migration V1 failed:', error);
  }
}

/**
 * Get current migration version
 */
async function getMigrationVersion(): Promise<number> {
  try {
    const preferences = await get(PREFERENCES_STORE_KEY) as PreferencesStore | undefined;
    return preferences?.migrationVersion || 0;
  } catch (error) {
    console.error('Failed to get migration version:', error);
    return 0;
  }
}

/**
 * Set migration version
 */
async function setMigrationVersion(version: number): Promise<void> {
  try {
    const preferences = await get(PREFERENCES_STORE_KEY) as PreferencesStore || {};
    preferences.migrationVersion = version;
    await set(PREFERENCES_STORE_KEY, preferences);
  } catch (error) {
    console.error('Failed to set migration version:', error);
  }
}

/**
 * Check if app initialization is needed (for testing/debugging)
 */
export async function isAppInitialized(): Promise<boolean> {
  try {
    const preferences = await get(PREFERENCES_STORE_KEY) as PreferencesStore | undefined;
    return preferences?.migrationVersion === CURRENT_MIGRATION_VERSION;
  } catch (error) {
    console.error('Failed to check app initialization status:', error);
    return false;
  }
}