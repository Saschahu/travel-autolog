import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock handlers for external APIs
export const handlers = [
  // Supabase session probe
  http.get('https://*.supabase.co/rest/v1/*', () => {
    return HttpResponse.json({ message: 'Session probe OK' });
  }),

  // Supabase auth endpoints
  http.post('https://*.supabase.co/auth/v1/*', () => {
    return HttpResponse.json({ access_token: 'mock-token', user: { id: 'mock-user' } });
  }),

  // Mapbox tiles
  http.get('https://api.mapbox.com/styles/v1/*/*', () => {
    return new HttpResponse(new ArrayBuffer(0), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  // Mapbox tile requests
  http.get('https://*.tiles.mapbox.com/*/*', () => {
    return new HttpResponse(new ArrayBuffer(256), {
      status: 200,
      headers: { 'Content-Type': 'image/png' }
    });
  }),

  // Generic API fallback
  http.get('*', () => {
    return new HttpResponse(null, { status: 404 });
  })
];

// Setup MSW server
export const server = setupServer(...handlers);