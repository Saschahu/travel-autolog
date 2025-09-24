/**
 * Token Storage Module
 * 
 * Handles authentication token storage with support for both IndexedDB (default)
 * and optional cookie-based authentication mode.
 */

/**
 * Check if cookie-based authentication mode is enabled
 */
function isCookieMode(): boolean {
  return import.meta.env.VITE_AUTH_COOKIE_MODE === 'true';
}

/**
 * Get the session URL for cookie-based authentication
 */
function getSessionUrl(): string {
  return import.meta.env.VITE_AUTH_SESSION_URL || '/auth/session';
}

/**
 * Interface for authentication session data
 */
export interface AuthSession {
  user: {
    id: string;
    email: string;
  } | null;
  isAuthenticated: boolean;
}

/**
 * Check authentication status based on current mode
 * @returns Promise<AuthSession> - Current authentication session
 */
export async function checkAuthStatus(): Promise<AuthSession> {
  if (isCookieMode()) {
    return checkCookieAuthStatus();
  } else {
    return checkIndexedDBAuthStatus();
  }
}

/**
 * Check authentication status via cookie-based session endpoint
 */
async function checkCookieAuthStatus(): Promise<AuthSession> {
  try {
    const sessionUrl = getSessionUrl();
    const response = await fetch(sessionUrl, {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const session = await response.json();
      return {
        user: session.user || null,
        isAuthenticated: !!session.user
      };
    } else {
      return {
        user: null,
        isAuthenticated: false
      };
    }
  } catch (error) {
    console.error('Cookie auth status check failed:', error);
    return {
      user: null,
      isAuthenticated: false
    };
  }
}

/**
 * Check authentication status via IndexedDB (default mode)
 * This integrates with the existing Supabase auth system
 */
async function checkIndexedDBAuthStatus(): Promise<AuthSession> {
  try {
    // This is a placeholder for IndexedDB-based auth status check
    // The actual implementation would integrate with the existing AuthContext
    // and Supabase authentication system
    
    // Import Supabase client dynamically to avoid circular dependencies
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    
    return {
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email || ''
      } : null,
      isAuthenticated: !!session?.user
    };
  } catch (error) {
    console.error('IndexedDB auth status check failed:', error);
    return {
      user: null,
      isAuthenticated: false
    };
  }
}

/**
 * Clear authentication tokens/session based on current mode
 */
export async function clearAuthTokens(): Promise<void> {
  if (isCookieMode()) {
    // In cookie mode, tokens are managed server-side
    // Client-side logout would typically call a logout endpoint
    console.log('Cookie mode: Tokens are managed server-side');
  } else {
    // In IndexedDB mode, use existing Supabase signOut
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Failed to clear IndexedDB tokens:', error);
    }
  }
}

/**
 * Get current authentication mode for debugging/logging
 */
export function getAuthMode(): 'cookie' | 'indexeddb' {
  return isCookieMode() ? 'cookie' : 'indexeddb';
}

/**
 * Log current authentication mode configuration
 */
export function logAuthConfig(): void {
  const mode = getAuthMode();
  console.log(`Auth mode: ${mode}`);
  
  if (mode === 'cookie') {
    console.log(`Session URL: ${getSessionUrl()}`);
    console.log('Note: Tokens are managed server-side via HttpOnly cookies');
  } else {
    console.log('Note: Using IndexedDB storage via Supabase client');
  }
}