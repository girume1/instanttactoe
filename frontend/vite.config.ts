import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '',
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  },
  build: {
    rollupOptions: {
      // VERY IMPORTANT: force ONLY your index.html as entry
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