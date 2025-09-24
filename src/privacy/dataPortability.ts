/**
 * Data portability functions for privacy compliance
 * Provides export and deletion of local app data
 */

import { keys, get, clear } from 'idb-keyval';
import { Preferences } from '@capacitor/preferences';
import { resetConsent } from '@/lib/privacy/consentStorage';

export interface ExportedData {
  metadata: {
    exportDate: string;
    appVersion: string;
    dataVersion: string;
  };
  preferences: Record<string, any>;
  indexedDbData: Record<string, any>;
  localStorageData: Record<string, any>;
  capacitorPreferences: Record<string, any>;
}

/**
 * Export all local app data as a JSON file
 */
export async function exportLocalData(): Promise<Blob> {
  console.log('Starting local data export...');
  
  const exportData: ExportedData = {
    metadata: {
      exportDate: new Date().toISOString(),
      appVersion: '1.0.0', // Could be read from package.json in real implementation
      dataVersion: '1.0'
    },
    preferences: {},
    indexedDbData: {},
    localStorageData: {},
    capacitorPreferences: {}
  };

  try {
    // Export IndexedDB data
    const dbKeys = await keys();
    for (const key of dbKeys) {
      try {
        const value = await get(key);
        exportData.indexedDbData[String(key)] = value;
      } catch (error) {
        console.warn(`Failed to export IndexedDB key ${String(key)}:`, error);
      }
    }

    // Export localStorage data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          exportData.localStorageData[key] = value;
        } catch (error) {
          console.warn(`Failed to export localStorage key ${key}:`, error);
        }
      }
    }

    // Export Capacitor Preferences (available keys - we can't enumerate all keys easily)
    // We'll export known keys that the app uses
    const knownPreferenceKeys = [
      'userProfile',
      'telemetryConsent',
      'settings-store'
    ];

    for (const key of knownPreferenceKeys) {
      try {
        const result = await Preferences.get({ key });
        if (result.value !== null) {
          exportData.capacitorPreferences[key] = result.value;
        }
      } catch (error) {
        console.warn(`Failed to export Capacitor preference ${key}:`, error);
      }
    }

    console.log('Local data export completed successfully');
    return new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });

  } catch (error) {
    console.error('Failed to export local data:', error);
    throw new Error('Data export failed. Please try again.');
  }
}

/**
 * Download exported data as a file
 */
export function downloadExportedData(blob: Blob): void {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const filename = `privacy-export-${dateStr}.json`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Delete all local app data from the device
 */
export async function deleteLocalData(): Promise<void> {
  console.log('Starting local data deletion...');
  
  const errors: string[] = [];

  try {
    // Clear IndexedDB
    try {
      await clear(); // Clear the default store used by idb-keyval
      
      // Also clear any other IndexedDB databases we know about
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name) {
            try {
              await new Promise<void>((resolve, reject) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!);
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => reject(deleteReq.error);
                deleteReq.onblocked = () => {
                  console.warn(`Database ${db.name} deletion blocked`);
                  resolve(); // Don't fail the whole process
                };
              });
            } catch (error) {
              console.warn(`Failed to delete database ${db.name}:`, error);
              errors.push(`Failed to delete database ${db.name}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
      errors.push('Failed to clear IndexedDB');
    }

    // Clear localStorage
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      errors.push('Failed to clear localStorage');
    }

    // Clear sessionStorage
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to clear sessionStorage:', error);
      errors.push('Failed to clear sessionStorage');
    }

    // Clear Capacitor Preferences
    try {
      const knownPreferenceKeys = [
        'userProfile',
        'telemetryConsent',
        'settings-store'
      ];

      for (const key of knownPreferenceKeys) {
        try {
          await Preferences.remove({ key });
        } catch (error) {
          console.warn(`Failed to remove Capacitor preference ${key}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to clear Capacitor Preferences:', error);
      errors.push('Failed to clear Capacitor Preferences');
    }

    // Clear caches
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    } catch (error) {
      console.error('Failed to clear caches:', error);
      errors.push('Failed to clear caches');
    }

    // Reset consent to unset (so dialog will show on next launch)
    try {
      await resetConsent();
    } catch (error) {
      console.error('Failed to reset consent:', error);
      errors.push('Failed to reset consent');
    }

    if (errors.length > 0) {
      console.warn('Data deletion completed with some errors:', errors);
      throw new Error(`Data deletion completed with errors: ${errors.join(', ')}`);
    }

    console.log('Local data deletion completed successfully');
    
  } catch (error) {
    console.error('Failed to delete local data:', error);
    if (errors.length > 0) {
      throw error; // Re-throw the error with collected issues
    } else {
      throw new Error('Data deletion failed. Please try again.');
    }
  }
}

/**
 * Get summary of data to be exported (for preview)
 */
export async function getDataSummary(): Promise<{
  indexedDbKeys: number;
  localStorageKeys: number;
  capacitorPreferences: number;
}> {
  try {
    const dbKeys = await keys();
    const localKeys = Object.keys(localStorage);
    
    // Count known Capacitor preferences
    const knownPreferenceKeys = ['userProfile', 'telemetryConsent', 'settings-store'];
    let capacitorCount = 0;
    
    for (const key of knownPreferenceKeys) {
      try {
        const result = await Preferences.get({ key });
        if (result.value !== null) {
          capacitorCount++;
        }
      } catch {
        // Ignore errors when counting
      }
    }

    return {
      indexedDbKeys: dbKeys.length,
      localStorageKeys: localKeys.length,
      capacitorPreferences: capacitorCount
    };
  } catch (error) {
    console.error('Failed to get data summary:', error);
    return {
      indexedDbKeys: 0,
      localStorageKeys: 0,
      capacitorPreferences: 0
    };
  }
}