import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { AuthProvider } from "@/contexts/AuthContext";
import { initCSPBoot, setupCSP } from '@/boot/cspBoot';

// Initialize CSP boot modules
initCSPBoot();
setupCSP();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
