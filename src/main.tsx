import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@/contexts/AuthContext';
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
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);

console.log('Travel AutoLog app rendered successfully with authentication');