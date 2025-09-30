import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from '@/contexts/AuthContext';
import i18n from './i18n/config'; // Initialize i18n early and use same instance
import './i18n/missingKeyLogger'; // Setup missing key logger in dev
import App from './App';
import './index.css';

console.log('Main.tsx loaded - initializing Travel AutoLog app');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  throw new Error('Root element not found');
}

console.log('Root element found, creating React root');
const root = createRoot(rootElement);

console.log('Rendering Travel AutoLog app with Supabase authentication...');
root.render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </I18nextProvider>
  </StrictMode>
);

console.log('Travel AutoLog app rendered successfully with authentication');