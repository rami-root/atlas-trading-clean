import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Set up the path alias: @/ maps to ./client/src
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  // Set root to project root because index.html is there
  root: './',
  build: {
    outDir: 'dist/client', // Output to dist/client in the root
    emptyOutDir: true,
  },
});
