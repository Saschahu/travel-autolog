import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadChartJS,
  resetChartLoader,
  getChartLoadAttempts,
  isChartLoaded
} from '../../../src/lib/loaders/chartLoader';

describe('chartLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChartLoader();
    vi.resetModules();
  });

  it('should not execute dynamic import until called', () => {
    // The module should not be loaded initially
    expect(isChartLoaded()).toBe(false);
    expect(getChartLoadAttempts()).toBe(0);
  });

  it('should simulate failure on first call then succeed on retry', async () => {
    // Mock successful import on retry
    const mockChart = { Chart: vi.fn(), registerables: [] };
    vi.doMock('chart.js', () => mockChart);

    // First call should fail, second should succeed
    const result = await loadChartJS();
    
    expect(getChartLoadAttempts()).toBe(2); // One failure, one success
    expect(isChartLoaded()).toBe(true);
    expect(result).toBe(mockChart);
  });

  it('should return cached module on subsequent calls', async () => {
    const mockChart = { Chart: vi.fn(), registerables: [] };
    vi.doMock('chart.js', () => mockChart);

    // First load
    const result1 = await loadChartJS();
    const attempts1 = getChartLoadAttempts();
    
    // Second load should use cache
    const result2 = await loadChartJS();
    const attempts2 = getChartLoadAttempts();
    
    expect(result1).toBe(result2);
    expect(attempts2).toBe(attempts1); // No additional attempts
  });

  it('should throw typed error after max retries', async () => {
    resetChartLoader();
    
    const originalConsoleError = console.error;
    console.error = vi.fn();
    
    try {
      await loadChartJS();
    } catch (error: any) {
      expect(error).toMatchObject({
        code: expect.any(String),
        message: expect.any(String),
        retryable: false
      });
    }
    
    console.error = originalConsoleError;
    expect(getChartLoadAttempts()).toBe(2);
    expect(isChartLoaded()).toBe(false);
  });

  it('should handle network errors with retry', async () => {
    let callCount = 0;
    vi.doMock('chart.js', () => {
      callCount++;
      if (callCount === 1) {
        const error = new Error('Network timeout');
        (error as any).code = 'NETWORK_ERROR';
        (error as any).retryable = true;
        throw error;
      }
      return { Chart: vi.fn(), registerables: [] };
    });

    const result = await loadChartJS();
    
    expect(result).toEqual({ Chart: expect.any(Function), registerables: [] });
    expect(getChartLoadAttempts()).toBe(2);
  });

  it('should not retry non-retryable errors', async () => {
    vi.doMock('chart.js', () => {
      const error = new Error('Permission denied');
      (error as any).code = 'INITIALIZATION_ERROR';
      (error as any).retryable = false;
      throw error;
    });

    await expect(loadChartJS()).rejects.toMatchObject({
      code: 'INITIALIZATION_ERROR',
      retryable: false
    });

    expect(getChartLoadAttempts()).toBe(1); // No retry
  });

  it('should reset loader state', async () => {
    const mockChart = { Chart: vi.fn() };
    vi.doMock('chart.js', () => mockChart);

    await loadChartJS();
    expect(isChartLoaded()).toBe(true);
    expect(getChartLoadAttempts()).toBeGreaterThan(0);

    resetChartLoader();
    expect(isChartLoaded()).toBe(false);
    expect(getChartLoadAttempts()).toBe(0);
  });

  it('should handle different Chart.js exports', async () => {
    const mockChart = { 
      Chart: vi.fn(),
      CategoryScale: vi.fn(),
      LinearScale: vi.fn(),
      registerables: []
    };
    vi.doMock('chart.js', () => mockChart);

    const result = await loadChartJS();
    expect(result).toBe(mockChart);
    expect(result.Chart).toBeDefined();
    expect(result.registerables).toBeDefined();
  });

  it('should provide correct error codes for different scenarios', async () => {
    // Test different error scenarios
    const scenarios = [
      {
        error: { message: 'Connection timeout' },
        expectedCode: 'MODULE_NOT_FOUND'
      },
      {
        error: { code: 'NETWORK_ERROR', message: 'Failed to fetch' },
        expectedCode: 'NETWORK_ERROR'
      }
    ];

    for (const scenario of scenarios) {
      resetChartLoader();
      vi.resetModules();
      
      vi.doMock('chart.js', () => {
        throw scenario.error;
      });

      await expect(loadChartJS()).rejects.toMatchObject({
        code: scenario.expectedCode
      });
    }
  });

  it('should handle loader with undefined error properties', async () => {
    vi.doMock('chart.js', () => {
      const error = new Error();
      // No code or message properties
      throw error;
    });

    await expect(loadChartJS()).rejects.toMatchObject({
      code: 'MODULE_NOT_FOUND',
      message: 'Unknown error loading Chart.js',
      retryable: false
    });
  });
});