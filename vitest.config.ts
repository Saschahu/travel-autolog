/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
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
        '**/*.config.*'
      ],
      thresholds: {
        lines: 35,
        branches: 30,
        functions: 35,
        statements: 35
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});