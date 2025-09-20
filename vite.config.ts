import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Separate route chunks
          if (id.includes('src/pages/GpsPage') || id.includes('components/gps/GPSPage')) {
            return 'route-gps';
          }
          if (id.includes('src/pages/ReportPage') || id.includes('components/export/ExportPage')) {
            return 'route-export';
          }
          if (id.includes('src/pages/SettingsPage') || id.includes('components/settings/')) {
            return 'route-settings';
          }
          if (id.includes('src/pages/Index')) {
            return 'route-home';
          }
          
          // Heavy libraries to separate chunks
          if (id.includes('mapbox-gl')) {
            return 'vendor-mapbox';
          }
          if (id.includes('exceljs')) {
            return 'vendor-excel';
          }
          if (id.includes('jspdf')) {
            return 'vendor-pdf';
          }
          if (id.includes('html2canvas')) {
            return 'vendor-canvas';
          }
          if (id.includes('@supabase/supabase-js')) {
            return 'vendor-supabase';
          }
          
          // Common vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            return 'vendor';
          }
        }
      }
    }
  }
}));
