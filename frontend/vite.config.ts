import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '',
  server: {
    port: 3000,  // Changed from default 5173
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      external: ['@linera/client'],
    },
  },
  optimizeDeps: {
    exclude: ['@linera/client'],
  },
  esbuild: {
    supported: {
      'top-level-await': true,
    },
  },
  plugins: [react()],
})
