/**
 * CSP-compliant bootstrap module
 * All JavaScript initialization that would normally be inline
 * must be moved here for production CSP compliance.
 */

import { migrateFromLocalStorage } from '@/security/tokenStorage';

/**
 * Initialize the application with CSP-compliant setup
 */
export async function initializeApp() {
  // Any bootstrap logic that was previously inline
  // Currently minimal - mainly ensuring CSP compliance
  
  // Log startup in development
  if (import.meta.env.DEV) {
    console.log('🚀 Travel AutoLog starting with CSP-compliant bootstrap');
  }
  
  // Migrate tokens from localStorage to secure storage
  if (import.meta.env.DEV) {
    try {
      const result = await migrateFromLocalStorage();
      if (result.migrated) {
        console.info('✅ Token migrated from localStorage to secure storage');
      } else if (result.reason) {
        console.info('ℹ️ Token migration:', result.reason);
      }
    } catch (error) {
      console.warn('⚠️ Token migration failed:', error);
    }
  } else {
    // In production, migrate but don't log details
    migrateFromLocalStorage().catch(() => {
      // Silent fail in production
    });
  }
  
  // Could add additional initialization here like:
  // - Service worker registration
  // - Global error handlers
  // - Performance monitoring setup
  // All must be CSP-compliant (no eval, no inline scripts)
}

/**
 * CSP-compliant event handler setup
 * Use this instead of inline handlers in HTML
 */
export function setupEventHandlers() {
  // Setup any global event handlers that were previously inline
  // Currently none needed, but framework for future use
}
