/**
 * Sentry Monitoring Bootstrap
 * 
 * Privacy-first monitoring setup with strict PII scrubbing and rate limiting.
 * Only initializes when VITE_SENTRY_DSN is set and in production mode.
 */

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

/**
 * Check if we're running in Capacitor
 */
const isCapacitor = (): boolean => {
  return !!(window as any).Capacitor;
};

/**
 * PII scrubbing function to remove sensitive data
 */
const beforeSend = (event: Sentry.Event): Sentry.Event | null => {
  // Remove emails from all string values
  const scrubEmails = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REMOVED]');
    }
    if (obj && typeof obj === 'object') {
      const result: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        result[key] = scrubEmails(obj[key]);
      }
      return result;
    }
    return obj;
  };

  // Remove tokens and sensitive headers
  if (event.request) {
    if (event.request.headers) {
      const headers = { ...event.request.headers };
      delete headers.Authorization;
      delete headers.authorization;
      delete headers['X-API-Key'];
      delete headers['x-api-key'];
      event.request.headers = headers;
    }
    
    // Remove query parameters from URLs
    if (event.request.url) {
      const url = new URL(event.request.url);
      url.search = '';
      event.request.url = url.toString();
    }
  }

  // Scrub localStorage/sessionStorage references
  if (event.contexts && event.contexts.extra) {
    delete event.contexts.extra.localStorage;
    delete event.contexts.extra.sessionStorage;
  }

  // Remove GPS coordinates from breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
      if (breadcrumb.data) {
        const data = { ...breadcrumb.data };
        delete data.latitude;
        delete data.longitude;
        delete data.coords;
        delete data.position;
        breadcrumb.data = data;
      }
      return breadcrumb;
    });
  }

  // Apply email scrubbing to the entire event
  event = scrubEmails(event);

  return event;
};

/**
 * Error filter to ignore known benign errors
 */
const beforeSendTransaction = (event: Sentry.Event): Sentry.Event | null => {
  const errorMessage = event.exception?.values?.[0]?.value || '';
  
  // Known benign errors to ignore
  const benignErrors = [
    'AbortError',
    'ResizeObserver loop limit exceeded',
    'ChunkLoadError',
    'Loading chunk',
    'Script error',
    'Network request failed',
    'Non-Error promise rejection captured'
  ];

  if (benignErrors.some(error => errorMessage.includes(error))) {
    return null; // Don't send these errors
  }

  return event;
};

/**
 * Initialize Sentry monitoring with privacy-first configuration
 */
export const initializeMonitoring = (): void => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const isProduction = import.meta.env.PROD;
  
  // Only initialize if DSN is set and we're in production
  if (!dsn || !isProduction) {
    console.log('[Monitoring] Sentry disabled:', { dsn: !!dsn, isProduction });
    return;
  }

  const tracesSampleRate = parseFloat(import.meta.env.VITE_SENTRY_TRACES_RATE || '0.15');
  const release = import.meta.env.VITE_APP_VERSION || '0.0.0-dev';
  const environment = import.meta.env.MODE || 'production';

  console.log('[Monitoring] Initializing Sentry:', { release, environment, tracesSampleRate });

  const integrations: Sentry.Integration[] = [
    new BrowserTracing({
      // Enable automatic route change tracking for React Router
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
  ];

  // Add Capacitor integration if running in Capacitor
  if (isCapacitor()) {
    import('@sentry/capacitor').then(({ init: initCapacitor }) => {
      initCapacitor({
        dsn,
        release,
        environment,
        tracesSampleRate,
        beforeSend,
        beforeSendTransaction,
        sendDefaultPii: false,
        enableTracing: true,
        replaysSessionSampleRate: 0, // Disabled by default for privacy
        integrations,
      });
    }).catch(err => {
      console.warn('[Monitoring] Failed to initialize Capacitor Sentry:', err);
    });
  } else {
    // Web initialization
    Sentry.init({
      dsn,
      release,
      environment,
      tracesSampleRate,
      beforeSend,
      beforeSendTransaction,
      sendDefaultPii: false,
      enableTracing: true,
      replaysSessionSampleRate: 0, // Disabled by default for privacy
      integrations,
    });
  }
};

// Re-export necessary React Router hooks for the BrowserTracing integration
import React from 'react';
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom';

// Export for use in error boundaries
export { Sentry };