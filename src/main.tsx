import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Remove synchronous i18n import - will be loaded dynamically
// import './i18n'
import { AuthProvider } from "@/contexts/AuthContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
