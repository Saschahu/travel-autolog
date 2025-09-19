import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { splitVendorChunkPlugin } from 'vite';
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    splitVendorChunkPlugin(),
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
        manualChunks: {
          // React core
          react: ['react', 'react-dom'],
          
          // Routing
          router: ['react-router-dom'],
          
          // State management and queries
          state: ['zustand', '@tanstack/react-query'],
          
          // Maps (should only be loaded via dynamic import)
          maps: ['mapbox-gl', 'react-map-gl'],
          
          // Excel libraries (should only be loaded via dynamic import)
          excel: ['exceljs', 'xlsx'],
          
          // PDF libraries (should only be loaded via dynamic import)
          pdf: ['jspdf', 'html2canvas'],
          
          // Auth (keep as is for now due to auth flow complexity)
          auth: ['@supabase/supabase-js'],
          
          // UI library
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-separator',
            '@radix-ui/react-avatar',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-slider',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group'
          ],
          
          // Icons
          icons: ['lucide-react'],
          
          // Date utilities
          dates: ['date-fns', 'date-fns-tz'],
          
          // Form handling
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // i18n
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          
          // Capacitor (mobile)
          capacitor: [
            '@capacitor/core',
            '@capacitor/camera',
            '@capacitor/filesystem',
            '@capacitor/geolocation',
            '@capacitor/local-notifications',
            '@capacitor/preferences',
            '@capacitor/share'
          ],
          
          // Utilities
          utils: [
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'cmdk',
            'vaul',
            'sonner',
            'next-themes',
            'embla-carousel-react',
            'recharts'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    exclude: [
      // Exclude heavy libraries from dev prebundling to prevent accidental eager pulls
      'mapbox-gl',
      'react-map-gl', 
      'exceljs',
      'xlsx',
      'jspdf'
    ]
  }
}));
