import { Page } from '@playwright/test';

export interface MockSession {
  access_token?: string;
  user?: {
    id: string;
    email: string;
  };
}

export async function mockSupabase(page: Page, options: { session?: MockSession } = {}) {
  await page.route('**/auth/v1/**', (route) => {
    const url = route.request().url();
    
    if (url.includes('/session')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(options.session || null)
      });
    }
    
    if (url.includes('/user')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: options.session?.user || null })
      });
    }
    
    // Block other Supabase requests
    return route.fulfill({
      status: 451,
      contentType: 'text/plain',
      body: 'SUPABASE BLOCKED BY TEST'
    });
  });
}

export async function mockMapbox(page: Page) {
  await page.route('**/mapbox/**', (route) => {
    const url = route.request().url();
    
    // Mock tile requests
    if (url.includes('/tiles/') || url.includes('/styles/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ mock: 'mapbox-response' })
      });
    }
    
    // Mock geocoding API
    if (url.includes('/geocoding/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          features: [{
            place_name: 'Mock Location',
            center: [10.75, 59.91]
          }]
        })
      });
    }
    
    // Block other Mapbox requests
    return route.fulfill({
      status: 451,
      contentType: 'text/plain',
      body: 'MAPBOX BLOCKED BY TEST'
    });
  });
}

export async function setupOfflineGuard(page: Page) {
  // Track blocked requests for logging
  const blockedRequests: string[] = [];
  
  await page.route('**/*', (route) => {
    const url = route.request().url();
    
    // Allow localhost variants
    const ALLOW = /^(http:\/\/localhost:4173|http:\/\/127\.0\.0\.1:4173|http:\/\/\[::1\]:4173)/;
    
    if (ALLOW.test(url)) {
      return route.continue();
    }
    
    // Block and log WebSocket connections
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      blockedRequests.push(`WS: ${url}`);
      return route.fulfill({ 
        status: 451, 
        contentType: 'text/plain', 
        body: 'WS BLOCKED BY TEST' 
      });
    }
    
    // Block and log all other external requests
    blockedRequests.push(`HTTP: ${url}`);
    return route.fulfill({ 
      status: 451, 
      contentType: 'text/plain', 
      body: 'NETWORK BLOCKED BY TEST' 
    });
  });

  // Return helper to get blocked request count
  return {
    getBlockedCount: () => blockedRequests.length,
    getBlockedRequests: () => [...blockedRequests],
    clearBlocked: () => blockedRequests.length = 0
  };
}