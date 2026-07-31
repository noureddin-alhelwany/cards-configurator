import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Contract fixtures shared with the backend tests. Aliased rather than copied so the
      // Python and TypeScript sides provably read the same file.
      '@fixtures': fileURLToPath(new URL('../registries/fixtures', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/proof-assets': 'http://127.0.0.1:8000',
      '/fonts': 'http://127.0.0.1:8000',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
