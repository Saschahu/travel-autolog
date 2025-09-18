import '@testing-library/jest-dom';

// Mock i18next for tests
import { vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

// Mock Zustand store
vi.mock('@/state/settingsStore', () => ({
  useSettingsStore: {
    getState: () => ({ locale: 'en' }),
    subscribe: vi.fn(),
  },
}));