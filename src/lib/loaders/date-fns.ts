/**
 * date-fns locale loader with timeout/retry mechanism
 * Handles dynamic locale imports with proper error handling
 */

export interface DateFnsLoadError {
  code: 'E_IMPORT_TIMEOUT' | 'E_IMPORT_FAILED' | 'E_LOCALE_NOT_FOUND';
  message: string;
  originalError?: unknown;
}

const localeCache = new Map<string, any>();

/**
 * Timeout+retry helper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  delay = 200
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      if (import.meta.env.DEV) {
        console.warn(`[date-fns-loader] Retrying after ${delay}ms...`, error);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, Math.min(delay * 1.5, 500));
    }
    throw error;
  }
}

/**
 * Load date-fns locale with timeout and retry
 */
export async function loadDateFnsLocale(locale: string): Promise<any> {
  if (localeCache.has(locale)) {
    return localeCache.get(locale);
  }

  try {
    const localeModule = await withRetry(async () => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Import timeout')), 3000);
      });

      let importPromise: Promise<any>;
      
      switch (locale) {
        case 'de':
          importPromise = import('date-fns/locale/de');
          break;
        case 'en':
          importPromise = import('date-fns/locale/en-GB');
          break;
        case 'nb':
          importPromise = import('date-fns/locale/nb');
          break;
        case 'sv':
          importPromise = import('date-fns/locale/sv');
          break;
        case 'da':
          importPromise = import('date-fns/locale/da');
          break;
        default:
          throw new Error(`Locale ${locale} not supported`);
      }
      
      return Promise.race([importPromise, timeoutPromise]);
    });

    localeCache.set(locale, localeModule);

    if (import.meta.env.DEV) {
      console.log(`[date-fns-loader] Successfully loaded locale: ${locale}`);
    }

    return localeModule;
  } catch (error) {
    const loadError: DateFnsLoadError = {
      code: error instanceof Error && error.message.includes('timeout') 
        ? 'E_IMPORT_TIMEOUT' 
        : error instanceof Error && error.message.includes('not supported')
          ? 'E_LOCALE_NOT_FOUND'
          : 'E_IMPORT_FAILED',
      message: `Failed to load date-fns locale '${locale}'. Date formatting may fall back to default locale.`,
      originalError: error
    };

    if (import.meta.env.DEV) {
      console.warn('[date-fns-loader] Locale load failed:', loadError);
    }

    throw loadError;
  }
}

/**
 * Load main date-fns format function
 */
export async function loadDateFnsFormat(): Promise<typeof import('date-fns')['format']> {
  try {
    const dateFnsModule = await withRetry(async () => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Import timeout')), 3000);
      });

      const importPromise = import('date-fns');
      
      return Promise.race([importPromise, timeoutPromise]);
    });

    if (import.meta.env.DEV) {
      console.log('[date-fns-loader] Successfully loaded date-fns format');
    }

    return dateFnsModule.format;
  } catch (error) {
    const loadError: DateFnsLoadError = {
      code: error instanceof Error && error.message.includes('timeout') 
        ? 'E_IMPORT_TIMEOUT' 
        : 'E_IMPORT_FAILED',
      message: 'Failed to load date-fns format function. Date formatting will be unavailable.',
      originalError: error
    };

    if (import.meta.env.DEV) {
      console.warn('[date-fns-loader] Format function load failed:', loadError);
    }

    throw loadError;
  }
}

/**
 * Reset loader state (useful for testing)
 */
export function resetDateFnsLoader(): void {
  localeCache.clear();
}