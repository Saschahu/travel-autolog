/**
 * ExcelJS loader with timeout/retry mechanism
 * Handles dynamic imports with typed error handling
 */

export interface ExcelJSLoadError {
  code: 'E_IMPORT_TIMEOUT' | 'E_IMPORT_FAILED';
  message: string;
  originalError?: unknown;
}

let excelJSModule: typeof import('exceljs') | null = null;

/**
 * Timeout+retry helper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  delay = 250
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      if (import.meta.env.DEV) {
        console.warn(`[exceljs-loader] Retrying after ${delay}ms...`, error);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, Math.min(delay * 1.5, 500));
    }
    throw error;
  }
}

/**
 * Load ExcelJS module with timeout and retry
 */
export async function loadExcelJS(): Promise<typeof import('exceljs')> {
  if (excelJSModule) return excelJSModule;

  try {
    excelJSModule = await withRetry(async () => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Import timeout')), 4000);
      });

      const importPromise = import('exceljs');
      
      return Promise.race([importPromise, timeoutPromise]);
    });

    if (import.meta.env.DEV) {
      console.log('[exceljs-loader] Successfully loaded ExcelJS');
    }

    return excelJSModule;
  } catch (error) {
    const loadError: ExcelJSLoadError = {
      code: error instanceof Error && error.message.includes('timeout') 
        ? 'E_IMPORT_TIMEOUT' 
        : 'E_IMPORT_FAILED',
      message: 'Failed to load ExcelJS. Excel export functionality will be unavailable.',
      originalError: error
    };

    if (import.meta.env.DEV) {
      console.warn('[exceljs-loader] Module load failed:', loadError);
    }

    throw loadError;
  }
}

/**
 * Reset loader state (useful for testing)
 */
export function resetExcelJSLoader(): void {
  excelJSModule = null;
}