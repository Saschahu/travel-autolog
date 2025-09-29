import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import locale resources
import deResources from './locales/de';
import enResources from './locales/en';
import nbResources from './locales/nb';

export type SupportedLocale = 'de' | 'en' | 'nb';

export const SUPPORTED_LOCALES: SupportedLocale[] = ['de', 'en', 'nb'];

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  de: 'Deutsch',
  en: 'English', 
  nb: 'Norsk bokmål'
};

// Consolidated resources with proper namespacing
const resources = {
  de: deResources,
  en: enResources,
  nb: nbResources
};

// Configure i18next with robust fallback and detection
const initI18n = async () => {
  // Only initialize if not already done
  if (i18n.isInitialized) {
    console.log('i18n already initialized');
    return i18n;
  }

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      
      // Language detection order: URL > stored preference > browser > fallback
      lng: 'de', // Default to German as requested
      fallbackLng: ['en', 'de'], // Robust fallback chain
      
      // Namespace configuration
      ns: ['common', 'jobs', 'dashboard', 'export', 'gps', 'settings', 'privacy', 'reports'],
      defaultNS: 'common',
      
      // Detection configuration
      detection: {
        order: ['localStorage', 'navigator', 'htmlTag'],
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage']
      },
      
      // Interpolation settings
      interpolation: {
        escapeValue: false, // React already does escaping
        format: (value, format) => {
          if (format === 'number') return new Intl.NumberFormat().format(value);
          if (format === 'currency') return new Intl.NumberFormat(undefined, { 
            style: 'currency', 
            currency: 'EUR' 
          }).format(value);
          return value;
        }
      },
      
      // Prevent showing keys
      returnEmptyString: false,
      
      // React integration
      react: {
        useSuspense: false // Avoid suspense-related issues
      },
      
      // Development options
      debug: import.meta.env.DEV,
      
      // Pluralization
      pluralSeparator: '_',
      contextSeparator: '_',
      
      // Fallback handling
      saveMissing: import.meta.env.DEV,  
      missingKeyHandler: import.meta.env.DEV ? (lng, ns, key) => {
        console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`);
      } : undefined,
      
      // Performance
      load: 'languageOnly', // Load 'en' instead of 'en-US'
      preload: SUPPORTED_LOCALES,
      
      // Whitelisting  
      supportedLngs: SUPPORTED_LOCALES,
      nonExplicitSupportedLngs: true
    });

  return i18n;
};

export { initI18n };
export default i18n;