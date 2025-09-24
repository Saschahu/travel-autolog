import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'
import { AuthProvider } from "@/contexts/AuthContext";
import { bootFlags } from "@/boot/flagsBoot";

// Initialize feature flags system early
bootFlags().catch(error => {
  console.error('Failed to boot feature flags:', error);
});

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
