/**
 * Centralized monitoring setup and control for Sentry telemetry
 * This module provides runtime enable/disable functionality for monitoring
 */

// Since Sentry is not yet added as a dependency, we'll prepare the interface
// When Sentry is added, uncomment the imports:
// import * as Sentry from '@sentry/browser';

let isMonitoringEnabled = false;
let isMonitoringInitialized = false;

// Environment variables for Sentry configuration
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';
const APP_ENV = import.meta.env.MODE || 'development';

/**
 * Initialize Sentry monitoring with privacy-focused configuration
 */
export function enableTelemetry(): void {
  // Guard: if no DSN configured, do nothing
  if (!SENTRY_DSN || SENTRY_DSN.trim() === '') {
    console.log('Telemetry: No DSN configured, skipping initialization');
    return;
  }

  // Guard: only initialize in production
  if (APP_ENV !== 'production') {
    console.log('Telemetry: Not in production mode, skipping initialization');
    return;
  }

  try {
    // When Sentry is added, uncomment this section:
    /*
    if (!isMonitoringInitialized) {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: APP_ENV,
        
        // Privacy-focused configuration
        beforeSend(event) {
          // Scrub PII and sensitive data
          if (event.user) {
            delete event.user.email;
            delete event.user.ip_address;
          }
          
          // Remove sensitive breadcrumbs
          if (event.breadcrumbs) {
            event.breadcrumbs = event.breadcrumbs.filter(breadcrumb => {
              return !breadcrumb.message?.includes('password') &&
                     !breadcrumb.message?.includes('token') &&
                     !breadcrumb.message?.includes('secret');
            });
          }
          
          return event;
        },
        
        // Sampling configuration
        tracesSampleRate: 0.1, // 10% performance monitoring
        replaysSessionSampleRate: 0.01, // 1% session replay
        replaysOnErrorSampleRate: 0.1, // 10% error session replay
        
        // Don't capture console logs in production
        integrations: [
          Sentry.browserTracingIntegration(),
          Sentry.replayIntegration({
            maskAllText: true, // Privacy: mask all text in replays
            blockAllMedia: true, // Privacy: block all media in replays
          }),
        ],
      });
      
      isMonitoringInitialized = true;
    }
    */

    isMonitoringEnabled = true;
    console.log('Telemetry: Monitoring enabled');
  } catch (error) {
    console.error('Failed to enable telemetry:', error);
  }
}

/**
 * Disable Sentry monitoring and prevent future sends
 */
export function disableTelemetry(): void {
  try {
    if (isMonitoringEnabled) {
      // When Sentry is added, uncomment this section:
      /*
      if (isMonitoringInitialized) {
        Sentry.close();
      }
      */
      
      isMonitoringEnabled = false;
      console.log('Telemetry: Monitoring disabled');
    }
  } catch (error) {
    console.error('Failed to disable telemetry:', error);
  }
}

/**
 * Check if monitoring is currently enabled
 */
export function isTelemetryEnabled(): boolean {
  return isMonitoringEnabled;
}

/**
 * Initialize monitoring based on consent and environment
 */
export function initializeMonitoring(hasConsent: boolean): void {
  if (hasConsent && SENTRY_DSN && APP_ENV === 'production') {
    enableTelemetry();
  } else {
    console.log('Telemetry: Not initializing due to consent/config:', {
      hasConsent,
      hasDsn: !!SENTRY_DSN,
      isProduction: APP_ENV === 'production'
    });
  }
}

/**
 * Toggle monitoring on/off based on consent
 */
export function setTelemetryEnabled(enabled: boolean): void {
  if (enabled) {
    enableTelemetry();
  } else {
    disableTelemetry();
  }
}