import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Minimal core translations - only essentials for initial load
const minimalTranslations = {
  de: {
    translation: {
      dashboard: 'Dashboard',
      location: 'GPS',
      export: 'Export',
      loading: 'Lade...',
      save: 'Speichern',
      cancel: 'Abbrechen',
      error: 'Fehler',
      success: 'Erfolgreich',
    }
  },
  en: {
    translation: {
      dashboard: 'Dashboard',
      location: 'Location', 
      export: 'Export',
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      error: 'Error',
      success: 'Success',
    }
  }
};

// Dynamic locale loading for full translations
const loadFullLocale = async (locale: string) => {
  switch (locale) {
    case 'en':
      return import('./locales/en').then(module => ({
        translation: module.enTranslations,
        job: module.jobTranslationsEn
      }));
    case 'de':
      // For now, return the minimal German translations extended
      return {
        translation: {
          ...minimalTranslations.de.translation,
          // Core German translations
          customer: 'Kunde',
          machine: 'Maschine',
          times: 'Zeiten',
          overtime: 'Überstunden',
          newJob: 'Neuer Job',
          editJob: 'Auftrag bearbeiten',
          start: 'Starten',
          pause: 'Pausieren',
          details: 'Details',
          edit: 'Bearbeiten',
        },
        job: {
          dialogTitle: 'Auftrag bearbeiten',
          subtitle: 'Alle Job-Daten bearbeiten',
          buttons: { save: 'Speichern', cancel: 'Abbrechen' }
        }
      };
    default:
      return import('./locales/en').then(module => ({
        translation: module.enTranslations,
        job: module.jobTranslationsEn
      }));
  }
};

// Initialize with minimal resources
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: minimalTranslations,
    lng: 'de',
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false
    }
  });

// Dynamic language switching with full locale loading
export const switchLanguage = async (locale: string) => {
  try {
    const fullLocale = await loadFullLocale(locale);
    i18n.addResourceBundle(locale, 'translation', fullLocale.translation, true, true);
    i18n.addResourceBundle(locale, 'job', fullLocale.job, true, true);
    await i18n.changeLanguage(locale);
  } catch (error) {
    console.error('Failed to load locale:', locale, error);
    // Fallback to minimal translations
    await i18n.changeLanguage(locale);
  }
};

export default i18n;