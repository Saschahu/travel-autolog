import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Add bundle analyzer when ANALYZE=1 is set
    process.env.ANALYZE && visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2022', // Modern target to reduce polyfills
    rollupOptions: {
      output: {
        manualChunks: {
          // Auth & Database - defer to post-login
          'supabase': ['@supabase/supabase-js'],
          // UI Libraries - split heavy UI components
          'radix-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-menubar',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-collapsible',
          ],
          // Date libraries - defer locale loading
          'date-libs': ['date-fns', 'date-fns-tz', 'date-holidays'],
          // Heavy utilities - defer to usage
          'excel-pdf': ['exceljs', 'jspdf', 'html2canvas', 'xlsx'],
          // Maps and geo
          'maps': ['mapbox-gl', 'react-map-gl'],
          // Charts and data viz
          'charts': ['recharts'],
          // i18n - will be split per locale later
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
        },
      },
    },
  },
}));
