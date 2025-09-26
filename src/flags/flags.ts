// Feature Flags Core Module
import { get, set, del } from 'idb-keyval';

// Types
export type FlagKey = string;
export type FlagValue = boolean | number | string;

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

type Flags = Record<FlagKey, FlagValue>;

// Initial flag registry
export const FLAG_REGISTRY: Record<FlagKey, FlagDef> = {
  'gps.enhancedTelemetry': {
    key: 'gps.enhancedTelemetry',
    default: false,
    description: 'Enable enhanced GPS telemetry collection',
    since: '2024-01-01'
  },
  'ui.experimentalPdf': {
    key: 'ui.experimentalPdf',
    default: false,
    description: 'Enable experimental PDF generation features',
    since: '2024-01-01'
  },
  'perf.deferHeavyImports': {
    key: 'perf.deferHeavyImports',
    default: true,
    description: 'Defer heavy module imports for better performance',
    since: '2024-01-01'
  },
  'security.strictCSP': {
    key: 'security.strictCSP',
    default: true,
    description: 'Enable strict Content Security Policy',
    since: '2024-01-01'
  },
  'export.excelV2': {
    key: 'export.excelV2',
    default: false,
    description: 'Use new Excel export engine (v2)',
    since: '2024-01-01'
  }
};

// Storage keys
const IDB_KEY = 'config.flags';
const CAPACITOR_PREFIX = 'flags_';
const LOCALSTORAGE_PREFIX = 'travel_flags_';

// Local overrides
const localOverrides = new Map<FlagKey, FlagValue>();

// Listeners for flag changes
type FlagListener = (flags: Record<FlagKey, FlagValue>) => void;
const listeners: FlagListener[] = [];

const defaultFlags: Flags = initializeDefaults();

// Initialize defaults on import for tests
export let currentFlags: Flags =
  (globalThis as any).__TEST_FLAGS__ ?? defaultFlags;

// Initialize with defaults
function initializeDefaults(): Record<FlagKey, FlagValue> {
  const defaults: Record<FlagKey, FlagValue> = {};
  Object.values(FLAG_REGISTRY).forEach(flag => {
    defaults[flag.key] = flag.default;
  });
  return defaults;
}

// Triple fallback storage helpers
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

async function loadFromCapacitorPreferences(): Promise<Record<FlagKey, FlagValue> | null> {
  try {
    // Check if we're in a Capacitor environment
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const { Preferences } = await import('@capacitor/preferences');
      const result: Record<FlagKey, FlagValue> = {};
      
      for (const flagKey of Object.keys(FLAG_REGISTRY)) {
        const { value } = await Preferences.get({ key: `${CAPACITOR_PREFIX}${flagKey}` });
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

async function saveToCapacitorPreferences(flags: Record<FlagKey, FlagValue>): Promise<void> {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const { Preferences } = await import('@capacitor/preferences');
      
      for (const [key, value] of Object.entries(flags)) {
        await Preferences.set({
          key: `${CAPACITOR_PREFIX}${key}`,
          value: JSON.stringify(value)
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

// Load cached flags with triple fallback
async function loadCachedFlags(): Promise<Record<FlagKey, FlagValue>> {
  // Try IndexedDB first
  const idbCache = await loadFromIndexedDB();
  if (idbCache?.flags) {
    return { ...initializeDefaults(), ...idbCache.flags };
  }
  
  // Try Capacitor Preferences
  const capacitorFlags = await loadFromCapacitorPreferences();
  if (capacitorFlags) {
    return { ...initializeDefaults(), ...capacitorFlags };
  }
  
  // Try localStorage
  const localStorageFlags = loadFromLocalStorage();
  if (localStorageFlags) {
    return { ...initializeDefaults(), ...localStorageFlags };
  }
  
  // Fall back to defaults
  return initializeDefaults();
}

// Save to all available storage methods
async function persistFlags(flags: Record<FlagKey, FlagValue>): Promise<void> {
  const cache: FlagCache = {
    flags,
    updatedAt: Date.now()
  };
  
  // Save to all available storage methods
  await Promise.allSettled([
    saveToIndexedDB(cache),
    saveToCapacitorPreferences(flags),
    Promise.resolve(saveToLocalStorage(flags))
  ]);
}

// Merge flags with priority: local override > remote > default
function mergeFlags(
  defaults: Record<FlagKey, FlagValue>,
  remote: Record<FlagKey, FlagValue> = {},
  local: Record<FlagKey, FlagValue> = {}
): Record<FlagKey, FlagValue> {
  const merged = { ...defaults };
  
  // Apply remote overrides
  for (const [key, value] of Object.entries(remote)) {
    if (key in FLAG_REGISTRY) {
      merged[key] = value;
    }
  }
  
  // Apply local overrides (highest priority)
  for (const [key, value] of Object.entries(local)) {
    if (key in FLAG_REGISTRY) {
      merged[key] = value;
    }
  }
  
  return merged;
}

// Update current flags and notify listeners
function updateFlags(newFlags: Record<FlagKey, FlagValue>): void {
  currentFlags = newFlags;
  listeners.forEach(listener => {
    try {
      listener(currentFlags);
    } catch (error) {
      console.error('Error in flag listener:', error);
    }
  });
}

// Public API
export function getFlag(key: FlagKey): FlagValue {
  // Local override has highest priority
  if (localOverrides.has(key)) {
    return localOverrides.get(key)!;
  }
  
  // Return from current flags or default
  return currentFlags[key] ?? FLAG_REGISTRY[key]?.default ?? false;
}

export function getAllFlags(): Record<FlagKey, FlagValue> {
  const result = { ...currentFlags };
  
  // Apply local overrides
  for (const [key, value] of localOverrides) {
    result[key] = value;
  }
  
  return result;
}

export function setLocalOverride(key: FlagKey, value: FlagValue): void {
  if (!(key in FLAG_REGISTRY)) {
    console.warn(`Unknown flag key: ${key}`);
    return;
  }
  
  localOverrides.set(key, value);
  updateFlags(getAllFlags());
}

export function clearLocalOverride(key: FlagKey): void {
  localOverrides.delete(key);
  updateFlags(getAllFlags());
}

export function clearAllLocalOverrides(): void {
  localOverrides.clear();
  updateFlags(getAllFlags());
}

export function subscribe(listener: FlagListener): () => void {
  listeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
}

// Initialize the flags system
export async function initializeFlags(): Promise<void> {
  try {
    const cachedFlags = await loadCachedFlags();
    updateFlags(cachedFlags);
  } catch (error) {
    console.error('Failed to initialize flags:', error);
    updateFlags(initializeDefaults());
  }
}

// Apply remote config to current flags
export async function applyRemoteConfig(remoteFlags: Record<FlagKey, FlagValue>): Promise<void> {
  const defaults = initializeDefaults();
  const localOverrideMap: Record<FlagKey, FlagValue> = {};
  
  // Convert local overrides map to object
  for (const [key, value] of localOverrides) {
    localOverrideMap[key] = value;
  }
  
  const mergedFlags = mergeFlags(defaults, remoteFlags, localOverrideMap);
  
  // Persist merged flags (excluding local overrides)
  const flagsToSave = mergeFlags(defaults, remoteFlags);
  await persistFlags(flagsToSave);
  
  updateFlags(mergedFlags);
}

// Get flag metadata
export function getFlagMeta(key: FlagKey): FlagDef | undefined {
  return FLAG_REGISTRY[key];
}

// Get flag source (default, remote, or local)
export function getFlagSource(key: FlagKey): 'default' | 'remote' | 'local' {
  if (localOverrides.has(key)) {
    return 'local';
  }
  
  const flagDef = FLAG_REGISTRY[key];
  if (flagDef && currentFlags[key] !== flagDef.default) {
    return 'remote';
  }
  
  return 'default';
}