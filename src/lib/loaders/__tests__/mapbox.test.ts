import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadMapboxGL, resetMapboxLoader, type MapboxLoadError } from '../mapbox';

// Mock the imports properly for Vitest
vi.mock('mapbox-gl', () => ({
  default: { Map: vi.fn() }
}));

vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}));

describe('Mapbox Loader', () => {
  beforeEach(() => {
    resetMapboxLoader();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should fail with network/offline import rejection scenario', async () => {
    // Mock dynamic import to simulate network failure
    vi.doMock('mapbox-gl', async () => {
      throw new Error('Network error');
    });
    vi.doMock('mapbox-gl/dist/mapbox-gl.css', async () => {
      throw new Error('Network error');
    });

    await expect(loadMapboxGL()).rejects.toMatchObject({
      code: 'E_CSS_LOAD_FAILED',
      message: 'Failed to load Mapbox GL CSS. Map styling may be broken.',
    } as MapboxLoadError);
  });

  it('should fail with CSS side-effect import error', async () => {
    // Mock CSS import to fail while JS import succeeds
    vi.doMock('mapbox-gl/dist/mapbox-gl.css', async () => {
      throw new Error('CSS load failed');
    });
    vi.doMock('mapbox-gl', () => ({ default: { Map: vi.fn() } }));

    await expect(loadMapboxGL()).rejects.toMatchObject({
      code: 'E_CSS_LOAD_FAILED',
      message: 'Failed to load Mapbox GL CSS. Map styling may be broken.',
    } as MapboxLoadError);
  });

  it('should succeed after CSS and JS load properly', async () => {
    vi.doMock('mapbox-gl/dist/mapbox-gl.css', () => Promise.resolve({}));
    vi.doMock('mapbox-gl', () => Promise.resolve({ default: { Map: vi.fn() } }));

    const result = await loadMapboxGL();
    expect(result).toBeDefined();
    expect(result.default.Map).toBeDefined();
  });

  it('should handle timeout scenario with proper error code', async () => {
    // Mock CSS import to succeed
    vi.doMock('mapbox-gl/dist/mapbox-gl.css', () => Promise.resolve({}));
    
    // Mock import to timeout
    vi.doMock('mapbox-gl', () => 
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Import timeout')), 6000);
      })
    );

    const loadPromise = loadMapboxGL();
    
    // Fast-forward past timeout and retry attempts
    await vi.advanceTimersByTimeAsync(10000);
    
    await expect(loadPromise).rejects.toMatchObject({
      code: 'E_IMPORT_TIMEOUT',
      message: 'Failed to load Mapbox GL. Map functionality will be unavailable.',
    } as MapboxLoadError);
  });
});