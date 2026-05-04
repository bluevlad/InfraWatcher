import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 4090,
    proxy: {
      '/api': {
        target: 'http://localhost:9090',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:9090',
        ws: true,
      },
    },
  },
});
