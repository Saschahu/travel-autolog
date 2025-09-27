/**
 * ExcelJS loader with timeout/retry mechanism
 * Handles dynamic imports with typed error handling
 */

export interface ExcelJSLoadError {
  code: 'E_IMPORT_TIMEOUT' | 'E_IMPORT_FAILED';
  message: string;
  originalError?: unknown;
}

let excelPromise: Promise<typeof import('exceljs')> | null = null;

export function resetExcelJSLoader(): void {
  excelPromise = null;
}

export async function loadExcelJS(opts?: {
  retries?: number;
  delayMs?: number;
}): Promise<typeof import('exceljs')> {
  if (!excelPromise) {
    const retries = opts?.retries ?? 3;
    const delayMs = opts?.delayMs ?? 300;

    excelPromise = (async () => {
      let attempt = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const mod = await import('exceljs');
          const resolved = (mod as any).default ?? mod;
          return resolved;
        } catch (error) {
          attempt += 1;
          if (attempt > retries) {
            const err = new Error(
              'Failed to load ExcelJS. Excel export functionality will be unavailable.',
            ) as ExcelJSLoadError;
            const message =
              error instanceof Error ? error.message.toLowerCase() : String(error);
            err.code = message.includes('timeout') ? 'E_IMPORT_TIMEOUT' : 'E_IMPORT_FAILED';
            err.originalError = error;
            throw err;
          }

          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    })();
  }

  try {
    return await excelPromise;
  } catch (error) {
    excelPromise = null;
    throw error;
  }
}