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
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/e2e/**'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/e2e/**', '**/node_modules/**', '**/dist/**', '**/scripts/**', '**/*.config.*', '**/*.d.ts'],
      thresholds: {
        lines: 0.1,  // Starting very low - target is to reach 70
        branches: 0.1, // Starting very low - target is to reach 60  
        functions: 0.1, // Starting very low - target is to reach 70
        statements: 0.1 // Starting very low - target is to reach 70
      }
    }
  }
}));
