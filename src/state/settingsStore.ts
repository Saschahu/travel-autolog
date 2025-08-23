import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LocaleCode = 'de' | 'en' | 'nb' | 'sv' | 'da';

export interface SettingsState {
  locale: LocaleCode;
  reportLanguage?: LocaleCode; // optional override
  
  // Actions
  setLocale: (locale: LocaleCode) => void;
  setReportLanguage: (reportLanguage?: LocaleCode) => void;
  getReportLang: () => LocaleCode;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      locale: 'de',
      reportLanguage: undefined,
      
      setLocale: (locale) => set({ locale }),
      setReportLanguage: (reportLanguage) => set({ reportLanguage }),
      getReportLang: () => get().reportLanguage ?? get().locale,
    }),
    {
      name: 'settings-store',
    }
  )
);