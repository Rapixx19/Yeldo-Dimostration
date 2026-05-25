import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    rollupOptions: {
      output: {
        // Hand-tuned chunks keep the landing page small. Recharts is the
        // heaviest dep — only Portfolio + ForecastChart need it.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-recharts': ['recharts'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-toast': ['react-hot-toast'],
          'vendor-http': ['axios'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
