import { Page, BrowserContext } from '@playwright/test';

/**
 * Apply global network blocking to prevent any external requests during E2E tests.
 * Only localhost requests are allowed to pass through.
 */
export async function blockExternalRequests(context: BrowserContext) {
  await context.route('**/*', (route) => {
    const url = route.request().url();
    
    // Allow localhost and local requests
    if (url.startsWith('http://localhost:4173') || 
        url.startsWith('https://localhost') ||
        url.startsWith('http://127.0.0.1') ||
        url.startsWith('https://127.0.0.1')) {
      return route.continue();
    }
    
    // Block everything else with a 451 status (Unavailable For Legal Reasons)
    console.log(`BLOCKING external request: ${url}`);
    return route.fulfill({ 
      status: 451, 
      contentType: 'text/plain', 
      body: 'NETWORK BLOCKED BY TEST' 
    });
  });
}

/**
 * Mock Supabase responses for authentication and data operations
 */
export async function mockSupabase(page: Page, options: { session?: any } = {}) {
  // Mock Supabase auth endpoints
  await page.route('**/auth/v1/token**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: options.session?.user || {
          id: 'mock-user-id',
          email: 'test@example.com',
          created_at: new Date().toISOString()
        }
      })
    });
  });

  // Mock Supabase user session
  await page.route('**/auth/v1/user**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.session?.user || {
        id: 'mock-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      })
    });
  });

  // Mock Supabase database queries
  await page.route('**/rest/v1/**', (route) => {
    const method = route.request().method();
    let response = {};
    
    if (method === 'GET') {
      response = { data: [], count: 0 };
    } else if (method === 'POST') {
      response = { data: [{ id: 'mock-id', created_at: new Date().toISOString() }] };
    } else if (method === 'PATCH' || method === 'PUT') {
      response = { data: [{ id: 'mock-id', updated_at: new Date().toISOString() }] };
    } else if (method === 'DELETE') {
      response = { data: [] };
    }
    
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

/**
 * Mock Mapbox API responses for map tiles and geocoding
 */
export async function mockMapbox(page: Page) {
  // Mock Mapbox tile requests
  await page.route('**/mapbox/**', (route) => {
    const url = route.request().url();
    
    if (url.includes('tiles') || url.includes('raster')) {
      // Return a minimal 1x1 transparent PNG for tile requests
      const transparentPng = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA6eNWxgAAAABJRU5ErkJggg==',
        'base64'
      );
      
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: transparentPng
      });
    } else if (url.includes('geocoding')) {
      // Mock geocoding responses
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            place_name: 'Mock Location',
            geometry: {
              type: 'Point',
              coordinates: [0, 0]
            },
            properties: {}
          }]
        })
      });
    } else {
      // Generic Mapbox API response
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok' })
      });
    }
  });
}

/**
 * Enable offline mode for the browser context
 */
export async function setOfflineMode(context: BrowserContext, offline: boolean = true) {
  await context.setOffline(offline);
}

/**
 * Setup comprehensive offline testing environment
 */
export async function setupOfflineEnvironment(context: BrowserContext, page: Page, options: {
  mockSupabase?: boolean;
  mockMapbox?: boolean;
  session?: any;
} = {}) {
  // Apply global network blocking
  await blockExternalRequests(context);
  
  // Setup mocks as requested
  if (options.mockSupabase !== false) {
    await mockSupabase(page, { session: options.session });
  }
  
  if (options.mockMapbox !== false) {
    await mockMapbox(page);
  }
  
  console.log('Offline environment setup complete');
}