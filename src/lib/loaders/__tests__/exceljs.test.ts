import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadExcelJS, resetExcelJSLoader, type ExcelJSLoadError } from '../exceljs';

// Mock the import properly for Vitest
vi.mock('exceljs', () => ({
  default: { Workbook: vi.fn() },
  Workbook: vi.fn()
}));

describe('ExcelJS Loader', () => {
  beforeEach(() => {
    resetExcelJSLoader();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should handle non-deterministic timer/retry race conditions', async () => {
    let attempt = 0;
    vi.doMock('exceljs', () => {
      attempt++;
      if (attempt === 1) {
        // First attempt fails due to timing
        return Promise.reject(new Error('Module loading race condition'));
      }
      // Second attempt succeeds
      return Promise.resolve({ Workbook: vi.fn() });
    });

    const loadPromise = loadExcelJS();
    
    // Advance timers to trigger retry
    await vi.advanceTimersByTimeAsync(250); // initial delay
    await vi.advanceTimersByTimeAsync(375); // retry delay with backoff
    
    const result = await loadPromise;
    expect(result).toBeDefined();
    expect(attempt).toBe(2);
  });

  it('should fail with timeout after retry attempts', async () => {
    vi.doMock('exceljs', () => 
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Import timeout')), 5000);
      })
    );

    const loadPromise = loadExcelJS();
    
    // Fast-forward past all timeout and retry attempts
    await vi.advanceTimersByTimeAsync(10000);
    
    await expect(loadPromise).rejects.toMatchObject({
      code: 'E_IMPORT_TIMEOUT',
      message: 'Failed to load ExcelJS. Excel export functionality will be unavailable.',
    } as ExcelJSLoadError);
  });

  it('should succeed on first attempt when module loads properly', async () => {
    vi.doMock('exceljs', () => Promise.resolve({
      Workbook: vi.fn(),
      default: { Workbook: vi.fn() }
    }));

    const result = await loadExcelJS();
    expect(result).toBeDefined();
    expect(result.Workbook).toBeDefined();
  });
});