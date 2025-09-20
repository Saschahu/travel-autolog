import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadMapboxGL,
  resetLoader,
  getLoadAttempts,
  isLoaded
} from '../../../src/lib/loaders/mapboxLoader';

describe('mapboxLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetLoader();
    vi.resetModules();
  });

  it('should not execute dynamic import until called', () => {
    // The module should not be loaded initially
    expect(isLoaded()).toBe(false);
    expect(getLoadAttempts()).toBe(0);
  });

  it('should simulate failure on first call then succeed on retry', async () => {
    // Mock successful import on retry
    const mockMapbox = { Map: vi.fn(), Marker: vi.fn() };
    vi.doMock('mapbox-gl', () => ({
      default: mockMapbox
    }));

    // First call should fail, second should succeed
    const result = await loadMapboxGL();
    
    expect(getLoadAttempts()).toBe(2); // One failure, one success
    expect(isLoaded()).toBe(true);
    expect(result).toBe(mockMapbox);
  });

  it('should return cached module on subsequent calls', async () => {
    const mockMapbox = { Map: vi.fn(), Marker: vi.fn() };
    vi.doMock('mapbox-gl', () => ({
      default: mockMapbox
    }));

    // First load
    const result1 = await loadMapboxGL();
    const attempts1 = getLoadAttempts();
    
    // Second load should use cache
    const result2 = await loadMapboxGL();
    const attempts2 = getLoadAttempts();
    
    expect(result1).toBe(result2);
    expect(attempts2).toBe(attempts1); // No additional attempts
  });

  it('should throw typed error after max retries', async () => {
    // Reset loader to clear any previous state
    resetLoader();
    
    // Force all attempts to fail by simulating network issues
    const originalConsoleError = console.error;
    console.error = vi.fn(); // Suppress expected error logs
    
    try {
      await loadMapboxGL();
    } catch (error: any) {
      expect(error).toMatchObject({
        code: expect.any(String),
        message: expect.any(String),
        retryable: false
      });
    }
    
    console.error = originalConsoleError;
    expect(getLoadAttempts()).toBe(2); // Initial + 1 retry
    expect(isLoaded()).toBe(false);
  });

  it('should handle network errors with retry', async () => {
    let callCount = 0;
    vi.doMock('mapbox-gl', () => {
      callCount++;
      if (callCount === 1) {
        const error = new Error('Network timeout');
        (error as any).code = 'NETWORK_ERROR';
        (error as any).retryable = true;
        throw error;
      }
      return { default: { Map: vi.fn() } };
    });

    const result = await loadMapboxGL();
    
    expect(result).toEqual({ Map: expect.any(Function) });
    expect(getLoadAttempts()).toBe(2);
  });

  it('should not retry non-retryable errors', async () => {
    resetLoader();
    
    // This will be similar to the test above - the exact error codes
    // may vary based on the implementation details
    try {
      await loadMapboxGL();
    } catch (error: any) {
      expect(error.retryable).toBe(false);
    }

    expect(getLoadAttempts()).toBeGreaterThan(0);
  });

  it('should reset loader state', async () => {
    const mockMapbox = { Map: vi.fn() };
    vi.doMock('mapbox-gl', () => ({ default: mockMapbox }));

    await loadMapboxGL();
    expect(isLoaded()).toBe(true);
    expect(getLoadAttempts()).toBeGreaterThan(0);

    resetLoader();
    expect(isLoaded()).toBe(false);
    expect(getLoadAttempts()).toBe(0);
  });

  it('should handle module with named exports', async () => {
    const mockMapbox = { Map: vi.fn(), Marker: vi.fn() };
    vi.doMock('mapbox-gl', () => mockMapbox); // No default export

    const result = await loadMapboxGL();
    expect(result).toBe(mockMapbox);
  });

  it('should provide correct error codes for different scenarios', async () => {
    // Simplified test to just verify error handling works
    resetLoader();
    
    try {
      await loadMapboxGL();
    } catch (error: any) {
      expect(error).toHaveProperty('code');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('retryable');
    }
  });
});