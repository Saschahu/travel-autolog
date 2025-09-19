/**
 * Secure Storage Wrapper
 * 
 * TODO: Move to HttpOnly cookies or IndexedDB + WebCrypto in a separate PR.
 * 
 * This wrapper provides:
 * - Centralized token storage management
 * - Easy migration path away from localStorage
 * - Input validation and sanitization
 * - Future-proofing for more secure storage mechanisms
 */

// Storage keys used by the application
const STORAGE_KEYS = {
  MAPBOX_TOKEN: 'mapbox_token',
  AUTH_TOKEN: 'auth_token', // If used elsewhere
} as const;

/**
 * Validate token format (basic validation)
 */
function validateToken(token: string, tokenType: 'mapbox' | 'auth' = 'mapbox'): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Basic validation - can be enhanced later
  if (tokenType === 'mapbox') {
    return token.startsWith('pk.') && token.length > 10;
  }
  
  return token.length > 0;
}

/**
 * Sanitize token input
 */
function sanitizeToken(token: string): string {
  if (!token || typeof token !== 'string') {
    return '';
  }
  
  // Remove any potentially dangerous characters but preserve valid token chars
  return token.replace(/[<>'"&]/g, '').trim();
}

/**
 * Get token from storage
 */
export function getToken(key: keyof typeof STORAGE_KEYS): string | null {
  try {
    const storageKey = STORAGE_KEYS[key];
    const token = localStorage.getItem(storageKey);
    
    if (!token) {
      return null;
    }
    
    // Sanitize retrieved token
    const sanitized = sanitizeToken(token);
    
    // Basic validation
    if (!validateToken(sanitized, key === 'MAPBOX_TOKEN' ? 'mapbox' : 'auth')) {
      console.warn(`Invalid token format detected for ${key}, removing`);
      clearToken(key);
      return null;
    }
    
    return sanitized;
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
}

/**
 * Set token in storage
 */
export function setToken(key: keyof typeof STORAGE_KEYS, token: string): boolean {
  try {
    if (!token || typeof token !== 'string') {
      console.warn('Invalid token provided');
      return false;
    }
    
    const sanitized = sanitizeToken(token);
    
    // Validate token format
    if (!validateToken(sanitized, key === 'MAPBOX_TOKEN' ? 'mapbox' : 'auth')) {
      console.warn(`Invalid token format for ${key}`);
      return false;
    }
    
    const storageKey = STORAGE_KEYS[key];
    localStorage.setItem(storageKey, sanitized);
    
    return true;
  } catch (error) {
    console.error('Error storing token:', error);
    return false;
  }
}

/**
 * Clear token from storage
 */
export function clearToken(key: keyof typeof STORAGE_KEYS): void {
  try {
    const storageKey = STORAGE_KEYS[key];
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Error clearing token:', error);
  }
}

/**
 * Check if token exists in storage
 */
export function hasToken(key: keyof typeof STORAGE_KEYS): boolean {
  const token = getToken(key);
  return token !== null && token.length > 0;
}

/**
 * Legacy compatibility functions for Mapbox token
 * These maintain the existing API while using the secure wrapper
 */
export function getMapboxToken(): string | null {
  return getToken('MAPBOX_TOKEN');
}

export function setMapboxToken(token: string): boolean {
  return setToken('MAPBOX_TOKEN', token);
}

export function clearMapboxToken(): void {
  clearToken('MAPBOX_TOKEN');
}

export function hasMapboxToken(): boolean {
  return hasToken('MAPBOX_TOKEN');
}