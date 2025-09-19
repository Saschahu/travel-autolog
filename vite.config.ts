import { defineConfig } from "vite";
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
    mode === 'development' &&
    componentTagger(),
    // Add visualizer plugin when ANALYZE=1
    process.env.ANALYZE === '1' && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
    }),
  ].filter(Boolean),
  build: {
    // Enable manifest generation for bundle analysis
    manifest: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
