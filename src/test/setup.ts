import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Setup MSW server for API mocking
const handlers = [
  // Supabase auth endpoints
  http.get('/auth/v1/user', () => {
    return HttpResponse.json({ id: 'test-user', email: 'test@example.com' });
  }),
  
  // Session endpoints
  http.get('/rest/v1/sessions*', () => {
    return HttpResponse.json([]);
  }),
  
  // Mapbox tile endpoints
  http.get('https://api.mapbox.com/styles/v1/*', () => {
    return HttpResponse.json({ version: 8, sources: {}, layers: [] });
  }),
  
  // Mapbox tiles
  http.get('https://api.mapbox.com/v4/*', () => {
    return new HttpResponse(new ArrayBuffer(0));
  }),
];

const server = setupServer(...handlers);

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset any request handlers that we may add during the tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

// Mock global objects
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mock-object-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});