import { get, set, del } from 'idb-keyval';

const MAPBOX_TOKEN_KEY = 'mapbox_token';
const MIGRATION_KEY = 'token_migration_complete';

export interface TokenValidationResult {
  isValid: boolean;
  token?: string;
  error?: string;
}

/**
 * Validates if a token looks like a valid Mapbox public token
 */
export function validateMapboxToken(token?: string): TokenValidationResult {
  if (!token) {
    return { isValid: false, error: 'Token is empty' };
  }

  const trimmed = token.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Token is empty after trimming' };
  }

  // Mapbox public token regex: pk.{base64-like-chars}
  const mapboxTokenRegex = /^pk\.[A-Za-z0-9._-]{10,}$/;
  if (!mapboxTokenRegex.test(trimmed)) {
    return { isValid: false, error: 'Token format invalid' };
  }

  return { isValid: true, token: trimmed };
}

/**
 * Reads token from IndexedDB
 */
export async function readTokenFromIDB(): Promise<string | undefined> {
  try {
    return await get(MAPBOX_TOKEN_KEY);
  } catch (error) {
    console.warn('Error reading token from IndexedDB:', error);
    return undefined;
  }
}

/**
 * Writes token to IndexedDB
 */
export async function writeTokenToIDB(token: string): Promise<void> {
  try {
    await set(MAPBOX_TOKEN_KEY, token);
  } catch (error) {
    console.error('Error writing token to IndexedDB:', error);
    throw error;
  }
}

/**
 * Removes token from IndexedDB
 */
export async function removeTokenFromIDB(): Promise<void> {
  try {
    await del(MAPBOX_TOKEN_KEY);
  } catch (error) {
    console.warn('Error removing token from IndexedDB:', error);
  }
}

/**
 * Checks if migration from localStorage to IndexedDB has been completed
 */
export async function isMigrationComplete(): Promise<boolean> {
  try {
    return (await get(MIGRATION_KEY)) === true;
  } catch {
    return false;
  }
}

/**
 * Marks migration as complete
 */
export async function markMigrationComplete(): Promise<void> {
  try {
    await set(MIGRATION_KEY, true);
  } catch (error) {
    console.warn('Error marking migration complete:', error);
  }
}

export async function migrateLegacyToken(
  local: Storage,
  kv: { set: (key: string, value: any) => Promise<void> },
): Promise<void> {
  const lsToken = local.getItem(MAPBOX_TOKEN_KEY);
  if (!lsToken) return;

  await kv.set(MAPBOX_TOKEN_KEY, lsToken);
  local.removeItem(MAPBOX_TOKEN_KEY);
  await kv.set(MIGRATION_KEY, true);
}

/**
 * Migrates token from localStorage to IndexedDB (idempotent)
 */
export async function migrateTokenStorage(): Promise<void> {
  // Check if already migrated
  if (await isMigrationComplete()) {
    return;
  }

  try {
    // Get token from localStorage
    const lsToken = localStorage.getItem(MAPBOX_TOKEN_KEY);
    let attemptedValidMigration = false;
    let migrationSucceeded = false;

    if (lsToken) {
      const validation = validateMapboxToken(lsToken);
      if (validation.isValid && validation.token) {
        attemptedValidMigration = true;
        try {
          await writeTokenToIDB(validation.token);
          // Remove from localStorage only after successful write
          localStorage.removeItem(MAPBOX_TOKEN_KEY);
          migrationSucceeded = true;
        } catch (writeError) {
          console.error('Token migration failed during IndexedDB write:', writeError);
          // Leave the token in localStorage so a future run can retry the migration
          throw writeError;
        }
      }
    }

    if (!attemptedValidMigration || migrationSucceeded) {
      await markMigrationComplete();
    }
  } catch (error) {
    console.error('Error during token migration:', error);
    throw error;
  }
}

/**
 * Gets token with cookie-mode flag bypass
 */
export async function getTokenWithCookieBypass(cookieMode: boolean = false): Promise<string | undefined> {
  if (cookieMode) {
    // In cookie mode, we bypass storage and check session URL directly
    try {
      const url = new URL(window.location.href);
      const sessionToken = url.searchParams.get('session_token');
      if (sessionToken) {
        const validation = validateMapboxToken(sessionToken);
        return validation.isValid ? validation.token : undefined;
      }
    } catch {
      // URL parsing failed, continue with normal flow
    }
    return undefined;
  }

  // Normal flow: migrate if needed, then read from IndexedDB
  await migrateTokenStorage();
  return await readTokenFromIDB();
}