import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LocaleCode = 'de' | 'en' | 'nb' | 'sv' | 'da';

export interface SettingsState {
  locale: LocaleCode;
  reportLanguage?: LocaleCode; // optional override
  pdfQuality?: number; // 50-80%, default 60%
  
  // Actions
  setLocale: (locale: LocaleCode) => void;
  setReportLanguage: (reportLanguage?: LocaleCode) => void;
  setPdfQuality: (quality: number) => void;
  getReportLang: () => LocaleCode;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      locale: 'de',
      reportLanguage: undefined,
      pdfQuality: 60, // default 60%
      
      setLocale: (locale) => set({ locale }),
      setReportLanguage: (reportLanguage) => set({ reportLanguage }),
      setPdfQuality: (pdfQuality) => set({ pdfQuality }),
      getReportLang: () => get().reportLanguage ?? get().locale,
    }),
    {
      name: 'settings-store',
    }
  )
);