import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3100,
    strictPort: true,
    cors: true,
    hmr: {
      clientPort: 3100,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4100',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 3100,
    strictPort: true,
    cors: true,
  },
});
