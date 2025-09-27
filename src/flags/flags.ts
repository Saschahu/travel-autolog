// Feature Flags Core Module
import { get, set, del } from 'idb-keyval';

export type FlagKey = string;
export type FlagValue = boolean | number | string;
export type FlagSource = 'default' | 'remote' | 'local';

export interface FlagDef {
  key: FlagKey;
  default: FlagValue;
  description: string;
  since: string; // version or date when flag was added
}

interface FlagCache {
  flags: Record<FlagKey, FlagValue>;
  updatedAt: number;
}

interface FlagRuntimeEntry {
  value: FlagValue;
  source: FlagSource;
}

const IDB_KEY = 'config.flags';
const CAPACITOR_PREFIX = 'flags_';
const LOCALSTORAGE_PREFIX = 'travel_flags_';

export const FLAG_REGISTRY: Record<FlagKey, FlagDef> = {
  'gps.enhancedTelemetry': {
    key: 'gps.enhancedTelemetry',
    default: false,
    description: 'Enable enhanced GPS telemetry collection',
    since: '2024-01-01',
  },
  'ui.experimentalPdf': {
    key: 'ui.experimentalPdf',
    default: false,
    description: 'Enable experimental PDF generation features',
    since: '2024-01-01',
  },
  'perf.deferHeavyImports': {
    key: 'perf.deferHeavyImports',
    default: true,
    description: 'Defer heavy module imports for better performance',
    since: '2024-01-01',
  },
  'security.strictCSP': {
    key: 'security.strictCSP',
    default: true,
    description: 'Enable strict Content Security Policy',
    since: '2024-01-01',
  },
  'export.excelV2': {
    key: 'export.excelV2',
    default: false,
    description: 'Use new Excel export engine (v2)',
    since: '2024-01-01',
  },
};

type FlagListener = (flags: Record<FlagKey, FlagValue>) => void;
const listeners: FlagListener[] = [];

const DEFAULT_FLAG_VALUES = initializeDefaults();
const runtime: Record<FlagKey, FlagRuntimeEntry> = initializeRuntime();
const remoteFlagValues: Partial<Record<FlagKey, FlagValue>> = {};

function initializeDefaults(): Record<FlagKey, FlagValue> {
  const defaults: Record<FlagKey, FlagValue> = {};
  for (const flag of Object.values(FLAG_REGISTRY)) {
    defaults[flag.key] = flag.default;
  }
  return defaults;
}

function initializeRuntime(): Record<FlagKey, FlagRuntimeEntry> {
  const entries: Record<FlagKey, FlagRuntimeEntry> = {};
  const testSeed = (globalThis as any).__TEST_FLAGS__ as
    | Record<FlagKey, FlagValue>
    | undefined;

  for (const [key, defaultValue] of Object.entries(DEFAULT_FLAG_VALUES) as [
    FlagKey,
    FlagValue,
  ][]) {
    const seededValue = testSeed?.[key];
    entries[key] = {
      value: seededValue ?? defaultValue,
      source: 'default',
    };
  }

  return entries;
}

function getAllRuntimeFlags(): Record<FlagKey, FlagValue> {
  const snapshot: Record<FlagKey, FlagValue> = {};
  for (const [key, entry] of Object.entries(runtime) as [FlagKey, FlagRuntimeEntry][]) {
    snapshot[key] = entry.value;
  }
  return snapshot;
}

function notifyListeners(): void {
  const snapshot = getAllRuntimeFlags();
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch (error) {
      console.error('Error in flag listener:', error);
    }
  }
}

function setRuntimeValue(key: FlagKey, value: FlagValue, source: FlagSource): void {
  if (!(key in runtime)) {
    return;
  }
  runtime[key] = { value, source };
}

async function loadFromIndexedDB(): Promise<FlagCache | null> {
  try {
    return await get(IDB_KEY);
  } catch (error) {
    console.warn('Failed to load flags from IndexedDB:', error);
    return null;
  }
}

async function saveToIndexedDB(cache: FlagCache): Promise<void> {
  try {
    await set(IDB_KEY, cache);
  } catch (error) {
    console.warn('Failed to save flags to IndexedDB:', error);
  }
}

async function loadFromCapacitorPreferences(): Promise<
  Record<FlagKey, FlagValue> | null
> {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const { Preferences } = await import('@capacitor/preferences');
      const result: Record<FlagKey, FlagValue> = {};

      for (const flagKey of Object.keys(FLAG_REGISTRY)) {
        const { value } = await Preferences.get({
          key: `${CAPACITOR_PREFIX}${flagKey}`,
        });
        if (value !== null) {
          try {
            result[flagKey] = JSON.parse(value);
          } catch {
            // Ignore parse errors
          }
        }
      }

      return Object.keys(result).length > 0 ? result : null;
    }
  } catch (error) {
    console.warn('Failed to load flags from Capacitor Preferences:', error);
  }
  return null;
}

async function saveToCapacitorPreferences(
  flags: Record<FlagKey, FlagValue>,
): Promise<void> {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const { Preferences } = await import('@capacitor/preferences');

      for (const [key, value] of Object.entries(flags)) {
        await Preferences.set({
          key: `${CAPACITOR_PREFIX}${key}`,
          value: JSON.stringify(value),
        });
      }
    }
  } catch (error) {
    console.warn('Failed to save flags to Capacitor Preferences:', error);
  }
}

function loadFromLocalStorage(): Record<FlagKey, FlagValue> | null {
  try {
    const result: Record<FlagKey, FlagValue> = {};

    for (const flagKey of Object.keys(FLAG_REGISTRY)) {
      const value = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${flagKey}`);
      if (value !== null) {
        try {
          result[flagKey] = JSON.parse(value);
        } catch {
          // Ignore parse errors
        }
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  } catch (error) {
    console.warn('Failed to load flags from localStorage:', error);
    return null;
  }
}

function saveToLocalStorage(flags: Record<FlagKey, FlagValue>): void {
  try {
    for (const [key, value] of Object.entries(flags)) {
      localStorage.setItem(`${LOCALSTORAGE_PREFIX}${key}`, JSON.stringify(value));
    }
  } catch (error) {
    console.warn('Failed to save flags to localStorage:', error);
  }
}

async function loadCachedFlags(): Promise<Record<FlagKey, FlagValue>> {
  const defaults = { ...DEFAULT_FLAG_VALUES };

  const idbCache = await loadFromIndexedDB();
  if (idbCache?.flags) {
    return { ...defaults, ...idbCache.flags };
  }

  const capacitorFlags = await loadFromCapacitorPreferences();
  if (capacitorFlags) {
    return { ...defaults, ...capacitorFlags };
  }

  const localStorageFlags = loadFromLocalStorage();
  if (localStorageFlags) {
    return { ...defaults, ...localStorageFlags };
  }

  return defaults;
}

async function persistFlags(): Promise<void> {
  const snapshot: Record<FlagKey, FlagValue> = { ...DEFAULT_FLAG_VALUES };
  for (const [key, value] of Object.entries(remoteFlagValues) as [
    FlagKey,
    FlagValue,
  ][]) {
    snapshot[key] = value;
  }

  const cache: FlagCache = {
    flags: snapshot,
    updatedAt: Date.now(),
  };

  await Promise.allSettled([
    saveToIndexedDB(cache),
    saveToCapacitorPreferences(snapshot),
    Promise.resolve(saveToLocalStorage(snapshot)),
  ]);
}

export function getFlag(key: FlagKey): FlagValue {
  if (runtime[key]) {
    return runtime[key].value;
  }
  return DEFAULT_FLAG_VALUES[key] ?? false;
}

export function getAllFlags(): Record<FlagKey, FlagValue> {
  return getAllRuntimeFlags();
}

export function setLocalOverride(key: FlagKey, value: FlagValue): void {
  if (!(key in FLAG_REGISTRY)) {
    console.warn(`Unknown flag key: ${key}`);
    return;
  }

  setRuntimeValue(key, value, 'local');
  delete remoteFlagValues[key];
  notifyListeners();
}

export function clearLocalOverride(key: FlagKey): void {
  if (!(key in FLAG_REGISTRY)) {
    return;
  }

  delete remoteFlagValues[key];
  setRuntimeValue(key, DEFAULT_FLAG_VALUES[key], 'default');
  notifyListeners();
}

export function clearAllLocalOverrides(): void {
  for (const key of Object.keys(runtime) as FlagKey[]) {
    if (runtime[key].source === 'local') {
      delete remoteFlagValues[key];
      setRuntimeValue(key, DEFAULT_FLAG_VALUES[key], 'default');
    }
  }
  notifyListeners();
}

export function subscribe(listener: FlagListener): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

export async function initializeFlags(): Promise<void> {
  try {
    const cachedFlags = await loadCachedFlags();

    for (const [key, value] of Object.entries(cachedFlags) as [
      FlagKey,
      FlagValue,
    ][]) {
      const defaultValue = DEFAULT_FLAG_VALUES[key];
      if (value !== undefined) {
        const source: FlagSource = value === defaultValue ? 'default' : 'remote';
        setRuntimeValue(key, value, source);
        if (source === 'remote') {
          remoteFlagValues[key] = value;
        } else {
          delete remoteFlagValues[key];
        }
      }
    }

    notifyListeners();
  } catch (error) {
    console.error('Failed to initialize flags:', error);
    for (const key of Object.keys(DEFAULT_FLAG_VALUES) as FlagKey[]) {
      setRuntimeValue(key, DEFAULT_FLAG_VALUES[key], 'default');
      delete remoteFlagValues[key];
    }
    notifyListeners();
  }
}

export async function applyRemoteConfig(
  payload: Partial<Record<FlagKey, FlagValue>>,
): Promise<void> {
  let updated = false;

  for (const [key, value] of Object.entries(payload) as [
    FlagKey,
    FlagValue,
  ][]) {
    if (!(key in FLAG_REGISTRY)) {
      continue;
    }

    remoteFlagValues[key] = value;

    const entry = runtime[key];
    if (entry?.source !== 'local') {
      setRuntimeValue(key, value, 'remote');
      updated = true;
    }
  }

  if (updated) {
    notifyListeners();
  }

  await persistFlags();
}

export function getFlagMeta(key: FlagKey): FlagDef | undefined {
  return FLAG_REGISTRY[key];
}

export function getFlagSource(key: FlagKey): FlagSource {
  return runtime[key]?.source ?? 'default';
}

export async function resetAllFlags(): Promise<void> {
  for (const key of Object.keys(runtime) as FlagKey[]) {
    setRuntimeValue(key, DEFAULT_FLAG_VALUES[key], 'default');
    delete remoteFlagValues[key];
  }
  notifyListeners();
  await persistFlags();
}

export async function removeAllPersistedFlags(): Promise<void> {
  try {
    await del(IDB_KEY);
  } catch (error) {
    console.warn('Failed to clear IndexedDB flags:', error);
  }

  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const { Preferences } = await import('@capacitor/preferences');
      const removals = Object.keys(FLAG_REGISTRY).map(key =>
        Preferences.remove({ key: `${CAPACITOR_PREFIX}${key}` }),
      );
      await Promise.allSettled(removals);
    }
  } catch (error) {
    console.warn('Failed to clear Capacitor flags:', error);
  }

  try {
    for (const key of Object.keys(FLAG_REGISTRY)) {
      localStorage.removeItem(`${LOCALSTORAGE_PREFIX}${key}`);
    }
  } catch (error) {
    console.warn('Failed to clear localStorage flags:', error);
  }
}
