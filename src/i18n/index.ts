import { initI18n } from './config';
export { SUPPORTED_LOCALES, LOCALE_NAMES } from './config';
export type { SupportedLocale } from './config';

// Initialize the i18n system without top-level await
let i18nInstance: any = null;

const getI18n = async () => {
  if (!i18nInstance) {
    i18nInstance = await initI18n();
  }
  return i18nInstance;
};

// Initialize immediately and export the instance
initI18n().then(instance => {
  i18nInstance = instance;
});

export { getI18n };
export default getI18n;