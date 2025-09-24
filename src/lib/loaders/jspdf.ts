/**
 * jsPDF loader with timeout/retry mechanism
 * Provides resilient loading with typed error handling
 */

export interface JSPDFLoadError {
  code: 'E_IMPORT_TIMEOUT' | 'E_IMPORT_FAILED';
  message: string;
  originalError?: unknown;
}

let jsPDFModule: typeof import('jspdf') | null = null;

/**
 * Timeout+retry helper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  delay = 300
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      if (import.meta.env.DEV) {
        console.warn(`[jspdf-loader] Retrying after ${delay}ms...`, error);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, Math.min(delay * 1.5, 500));
    }
    throw error;
  }
}

/**
 * Load jsPDF module with timeout and retry
 */
export async function loadJSPDF(): Promise<typeof import('jspdf')> {
  if (jsPDFModule) return jsPDFModule;

  try {
    jsPDFModule = await withRetry(async () => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Import timeout')), 3500);
      });

      const importPromise = import('jspdf');
      
      return Promise.race([importPromise, timeoutPromise]);
    });

    if (import.meta.env.DEV) {
      console.log('[jspdf-loader] Successfully loaded jsPDF');
    }

    return jsPDFModule;
  } catch (error) {
    const loadError: JSPDFLoadError = {
      code: error instanceof Error && error.message.includes('timeout') 
        ? 'E_IMPORT_TIMEOUT' 
        : 'E_IMPORT_FAILED',
      message: 'Failed to load jsPDF. PDF export functionality will be unavailable.',
      originalError: error
    };

    if (import.meta.env.DEV) {
      console.warn('[jspdf-loader] Module load failed:', loadError);
    }

    throw loadError;
  }
}

/**
 * Reset loader state (useful for testing)
 */
export function resetJSPDFLoader(): void {
  jsPDFModule = null;
}