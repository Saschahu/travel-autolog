import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExportFolderRef } from '@/lib/fs/directoryPicker';

export type LocaleCode = 'de' | 'en' | 'nb';

export interface SettingsState {
  locale: LocaleCode;
  reportLanguage?: LocaleCode; // optional override
  pdfQuality?: number; // 50-80%, default 60%
  exportDirRef?: ExportFolderRef; // unified directory reference
  
  // Actions
  setLocale: (locale: LocaleCode) => void;
  setReportLanguage: (reportLanguage?: LocaleCode) => void;
  setPdfQuality: (quality: number) => void;
  setExportDirRef: (ref?: ExportFolderRef) => void;
  getReportLang: () => LocaleCode;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      reportLanguage: undefined,
      pdfQuality: 60, // default 60%
      exportDirRef: undefined,
      
      setLocale: (locale) => set({ locale }),
      setReportLanguage: (reportLanguage) => set({ reportLanguage }),
      setPdfQuality: (pdfQuality) => set({ pdfQuality }),
      setExportDirRef: (exportDirRef) => set({ exportDirRef }),
      getReportLang: () => get().reportLanguage ?? get().locale,
    }),
    {
      name: 'settings-store',
      partialize: (state) => {
        const { exportDirRef, ...rest } = state;
        return {
          ...rest,
          // Only persist Android URI references, web handles are stored in IndexedDB
          exportDirRef: exportDirRef?.kind === 'android-uri' ? exportDirRef : undefined
        };
      }
    }
  )
);