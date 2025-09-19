import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { AuthProvider } from "@/contexts/AuthContext";
import { initializeApp } from "@/boot/cspBoot";

// Initialize CSP-compliant bootstrap (async)
initializeApp().then(() => {
  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}).catch((error) => {
  console.error('Failed to initialize app:', error);
  // Fallback: start app anyway
  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
});
