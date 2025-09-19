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
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Maps chunk - keep Mapbox separate
          if (id.includes('mapbox-gl') || id.includes('react-map-gl')) {
            return 'maps';
          }
          // Excel chunk - heavy office functionality  
          if (id.includes('exceljs')) {
            return 'excel';
          }
          // PDF chunk - report generation
          if (id.includes('jspdf')) {
            return 'pdf';
          }
          // Auth chunk - Supabase and authentication
          if (id.includes('@supabase/supabase-js')) {
            return 'auth';
          }
          // Charts chunk
          if (id.includes('recharts')) {
            return 'charts';
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'dates';
          }  
          // DOMPurify chunk (security)
          if (id.includes('dompurify')) {
            return 'security';
          }
          // Large UI components
          if (id.includes('react-day-picker')) {
            return 'calendar';
          }
          // Vendor chunk for smaller common libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
    // Keep chunk size warning but don't fail build
    chunkSizeWarningLimit: 800,
  },
  // Help prevent accidental eager loading in dev
  optimizeDeps: {
    exclude: [
      'mapbox-gl',
      'react-map-gl', 
      'exceljs',
      'jspdf',
      '@supabase/supabase-js'
    ]
  }
}));
