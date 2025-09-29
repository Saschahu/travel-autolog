import { initI18n } from './config';
export { SUPPORTED_LOCALES, LOCALE_NAMES } from './config';
export type { SupportedLocale } from './config';

// Initialize the new i18n system
const i18n = await initI18n();

export default i18n;