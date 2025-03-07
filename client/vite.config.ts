import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteImagemin from 'vite-plugin-imagemin';
import compression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react(),
    viteImagemin({
      mozjpeg: { quality: 75 },
      pngquant: { quality: [0.7, 0.8] },
      webp: { quality: 80 }
    }),
    compression({ algorithm: 'brotliCompress' }) 
  ],
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 500, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react-vendor';
            if (id.includes('lodash')) return 'lodash-vendor';
            return 'vendor'; // Separate dependencies
          }
        }
      }
    }
  }
});
