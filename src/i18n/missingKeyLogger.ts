import i18n from 'i18next';

/**
 * Development helper to log missing translation keys
 * Only active in development mode
 */
export const setupMissingKeyLogger = () => {
  if (import.meta.env.DEV) {
    i18n.on('missingKey', (lng, namespace, key, defaultValue) => {
      console.warn(
        `🌐 Missing translation key: ${namespace}:${key} for language: ${lng}`,
        { defaultValue }
      );
    });
    
    console.log('🌐 i18n missing key logger initialized');
  }
};

// Auto-setup in development
if (import.meta.env.DEV) {
  setupMissingKeyLogger();
}

export default setupMissingKeyLogger;