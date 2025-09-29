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
  define: {
    // Ensure web preview mode is available
    'import.meta.env.VITE_WEB_PREVIEW': JSON.stringify(process.env.VITE_WEB_PREVIEW || '1')
  }
}))