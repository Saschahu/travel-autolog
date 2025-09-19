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
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['e2e/**'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'e2e/**',
        'dist/**',
        '**/*.d.ts',
        '**/vite-env.d.ts',
        '**/playwright/**',
        '**/__mocks__/**',
        '**/*.config.*',
        '**/test/**',
        '**/tests/**',
        '**/*.test.*',
        '**/*.spec.*'
      ],
      thresholds: {
        lines: 0.5,
        branches: 0.5,
        functions: 0.5,
        statements: 0.5
      }
    }
  }
}));
