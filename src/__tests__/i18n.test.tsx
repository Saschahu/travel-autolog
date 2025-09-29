import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import '@testing-library/jest-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import locale resources
import deResources from '../i18n/locales/de';
import enResources from '../i18n/locales/en';
import nbResources from '../i18n/locales/nb';

// Test component that uses translations
const TestComponent = () => {
  const { useTranslation } = require('react-i18next');
  const { t } = useTranslation();
  
  return (
    <div>
      <h1 data-testid="edit-job">{t('editJob')}</h1>
      <h2 data-testid="customer-data">{t('customerData')}</h2>
      <h3 data-testid="machine-data">{t('machineData')}</h3>
      <button data-testid="save">{t('save')}</button>
      <button data-testid="cancel">{t('cancel')}</button>
    </div>
  );
};

// Test component for job form translations
const JobFormTestComponent = () => {
  const { useTranslation } = require('react-i18next');
  const { t } = useTranslation('jobs', { keyPrefix: 'edit.form' });
  
  return (
    <div>
      <h2 data-testid="form-title">{t('title')}</h2>
      <label data-testid="contact-label">{t('contact')}</label>
      <label data-testid="contact-phone-label">{t('contactPhone')}</label>
      <input data-testid="contact-input" placeholder={t('placeholders.contact')} />
      <button data-testid="form-save">{t('save')}</button>
      <button data-testid="form-cancel">{t('cancel')}</button>
    </div>
  );
};

// Setup test i18n instance
const setupI18n = async (language: string) => {
  const testI18n = i18n.createInstance();
  
  await testI18n
    .use(initReactI18next)
    .init({
      lng: language,
      fallbackLng: ['en', 'de'],
      resources: {
        de: deResources,
        en: enResources,
        nb: nbResources
      },
      ns: ['common', 'jobs'],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false
      },
      returnEmptyString: false
    });
    
  return testI18n;
};

describe('i18n Translation Tests', () => {
  describe('English Translations', () => {
    it('should render English labels correctly', async () => {
      const testI18n = await setupI18n('en');
      
      render(
        <I18nextProvider i18n={testI18n}>
          <TestComponent />
        </I18nextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('edit-job')).toHaveTextContent('Edit Job');
        expect(screen.getByTestId('customer-data')).toHaveTextContent('Customer Data');
        expect(screen.getByTestId('machine-data')).toHaveTextContent('Machine Data');
        expect(screen.getByTestId('save')).toHaveTextContent('Save');
        expect(screen.getByTestId('cancel')).toHaveTextContent('Cancel');
      });
    });
  });

  describe('German Translations', () => {
    it('should render German labels correctly', async () => {
      const testI18n = await setupI18n('de');
      
      render(
        <I18nextProvider i18n={testI18n}>
          <TestComponent />
        </I18nextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('edit-job')).toHaveTextContent('Auftrag bearbeiten');
        expect(screen.getByTestId('customer-data')).toHaveTextContent('Kundendaten');
        expect(screen.getByTestId('machine-data')).toHaveTextContent('Maschinendaten');
        expect(screen.getByTestId('save')).toHaveTextContent('Speichern');
        expect(screen.getByTestId('cancel')).toHaveTextContent('Abbrechen');
      });
    });
  });

  describe('Norwegian Translations', () => {
    it('should render Norwegian labels correctly', async () => {
      const testI18n = await setupI18n('nb');
      
      render(
        <I18nextProvider i18n={testI18n}>
          <TestComponent />
        </I18nextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('edit-job')).toHaveTextContent('Rediger jobb');
        expect(screen.getByTestId('customer-data')).toHaveTextContent('Kundedata');
        expect(screen.getByTestId('machine-data')).toHaveTextContent('Maskindata');
        expect(screen.getByTestId('save')).toHaveTextContent('Lagre');
        expect(screen.getByTestId('cancel')).toHaveTextContent('Avbryt');
      });
    });
  });

  describe('Language Switching', () => {
    it('should update labels when language changes', async () => {
      const testI18n = await setupI18n('en');
      
      const { rerender } = render(
        <I18nextProvider i18n={testI18n}>
          <TestComponent />
        </I18nextProvider>
      );

      // Initial English
      await waitFor(() => {
        expect(screen.getByTestId('edit-job')).toHaveTextContent('Edit Job');
      });

      // Change to German
      await testI18n.changeLanguage('de');
      
      rerender(
        <I18nextProvider i18n={testI18n}>
          <TestComponent />
        </I18nextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('edit-job')).toHaveTextContent('Auftrag bearbeiten');
        expect(screen.getByTestId('customer-data')).toHaveTextContent('Kundendaten');
      });
    });
  });

  describe('JobEntryForm Translations', () => {
    describe('English Job Form', () => {
      it('should render job form labels in English', async () => {
        const testI18n = await setupI18n('en');
        
        render(
          <I18nextProvider i18n={testI18n}>
            <JobFormTestComponent />
          </I18nextProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('form-title')).toHaveTextContent('Title');
          expect(screen.getByTestId('contact-label')).toHaveTextContent('Contact');
          expect(screen.getByTestId('contact-phone-label')).toHaveTextContent('Contact phone');
          expect(screen.getByTestId('contact-input')).toHaveAttribute('placeholder', 'Enter contact name');
          expect(screen.getByTestId('form-save')).toHaveTextContent('Save');
          expect(screen.getByTestId('form-cancel')).toHaveTextContent('Cancel');
        });
      });
    });

    describe('German Job Form', () => {
      it('should render job form labels in German', async () => {
        const testI18n = await setupI18n('de');
        
        render(
          <I18nextProvider i18n={testI18n}>
            <JobFormTestComponent />
          </I18nextProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('form-title')).toHaveTextContent('Titel');
          expect(screen.getByTestId('contact-label')).toHaveTextContent('Ansprechpartner');
          expect(screen.getByTestId('contact-phone-label')).toHaveTextContent('Telefon (Ansprechpartner)');
          expect(screen.getByTestId('contact-input')).toHaveAttribute('placeholder', 'Kontaktname eingeben');
          expect(screen.getByTestId('form-save')).toHaveTextContent('Speichern');
          expect(screen.getByTestId('form-cancel')).toHaveTextContent('Abbrechen');
        });
      });
    });

    describe('Norwegian Job Form', () => {
      it('should render job form labels in Norwegian', async () => {
        const testI18n = await setupI18n('nb');
        
        render(
          <I18nextProvider i18n={testI18n}>
            <JobFormTestComponent />
          </I18nextProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('form-title')).toHaveTextContent('Tittel');
          expect(screen.getByTestId('contact-label')).toHaveTextContent('Kontakt');
          expect(screen.getByTestId('contact-phone-label')).toHaveTextContent('Kontakttelefon');
          expect(screen.getByTestId('contact-input')).toHaveAttribute('placeholder', 'Skriv inn kontaktnavn');
          expect(screen.getByTestId('form-save')).toHaveTextContent('Lagre');
          expect(screen.getByTestId('form-cancel')).toHaveTextContent('Avbryt');
        });
      });
    });
  });

  describe('Missing Key Handling', () => {
    it('should not show raw keys for missing translations', async () => {
      const testI18n = await setupI18n('en');
      
      render(
        <I18nextProvider i18n={testI18n}>
          <TestComponent />
        </I18nextProvider>
      );

      // All tested keys should have translations, not show as raw keys
      await waitFor(() => {
        const editJob = screen.getByTestId('edit-job');
        expect(editJob.textContent).not.toBe('editJob');
        expect(editJob.textContent).not.toBe('common:editJob');
        expect(editJob.textContent).toBe('Edit Job');
      });
    });
  });
});