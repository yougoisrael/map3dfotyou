import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';
import { defineConfig as viteDef } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    cesium({
      rebuildCesium: false,
    }),
  ],

  define: {
    CESIUM_BASE_URL: JSON.stringify('/'),
  },

  build: {
    chunkSizeWarningLimit: 5000,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('cesium')) return 'cesium';
          if (id.includes('react')) return 'react';
        },
      },
    },
  },

  server: {
    port: 3000,
    cors: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },

  preview: {
    port: 4173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
  },

  optimizeDeps: {
    include: ['cesium'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
});
