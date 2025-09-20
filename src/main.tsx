import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { AuthProvider } from "@/contexts/AuthContext";
import { initializeMonitoring } from "@/boot/monitoring";

// Initialize monitoring as early as possible
initializeMonitoring();

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
