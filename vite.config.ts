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
    // Add bundle analyzer in analyze mode
    process.env.ANALYZE === '1' && {
      name: 'bundle-analyzer',
      generateBundle() {
        import('rollup-plugin-visualizer').then(({ visualizer }) => {
          visualizer({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true,
          });
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      external: ['xlsx'], // Externalize xlsx to avoid build errors since we removed it
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react';
            }
            if (id.includes('mapbox-gl')) {
              return 'map';
            }
            if (id.includes('exceljs')) {
              return 'excel';
            }
            if (id.includes('jspdf')) {
              return 'pdf';
            }
            if (id.includes('@radix-ui')) {
              return 'ui';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('date-fns') || id.includes('clsx') || id.includes('class-variance-authority')) {
              return 'utils';
            }
            return 'vendor';
          }
        }
      }
    }
  }
}));
