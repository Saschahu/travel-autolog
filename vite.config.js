import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  server: {
    host: "::",
    port: 8080,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    sourcemap: true,
    outDir: 'dist'
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  esbuild: {
    // Disable TypeScript checking for now to get basic app running
    include: /\.(ts|tsx)$/,
    exclude: []
  }
}))