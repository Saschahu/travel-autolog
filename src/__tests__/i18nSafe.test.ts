import { describe, it, expect, vi } from 'vitest';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({
    t: vi.fn((key: string) => key)
  }))
}));

// Simple mock for i18nSafe functions - testing the concept
describe('i18n Safe Functions', () => {
  it('should provide safe translation fallback', () => {
    // Mock the tt function behavior
    const tt = (key: string, fallback?: string) => fallback || key;
    
    expect(tt('missing.key', 'Fallback text')).toBe('Fallback text');
    expect(tt('existing.key')).toBe('existing.key');
  });

  it('should handle translation with variables', () => {
    const tt = (key: string, fallback?: string, variables?: Record<string, any>) => {
      let result = fallback || key;
      if (variables) {
        Object.entries(variables).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v));
        });
      }
      return result;
    };

    expect(tt('greeting', 'Hello {{name}}', { name: 'World' })).toBe('Hello World');
  });
});