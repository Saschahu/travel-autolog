import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Dynamic i18n initialization
let i18nPromise: Promise<any> | null = null;
let i18nInitialized = false;

const initializeI18n = () => {
  if (!i18nPromise) {
    i18nPromise = import('@/i18n').then(() => {
      i18nInitialized = true;
    });
  }
  return i18nPromise;
};

export const useI18n = () => {
  const [isReady, setIsReady] = useState(i18nInitialized);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!i18nInitialized) {
      initializeI18n().then(() => {
        setIsReady(true);
      });
    }
  }, []);

  return {
    t: isReady ? t : (key: string) => key, // Fallback to key if not ready
    i18n,
    isReady,
  };
};