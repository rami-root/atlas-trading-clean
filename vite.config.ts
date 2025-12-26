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
  // Ensure the base directory is set correctly for the client build
  root: './client',
  build: {
    outDir: '../dist/client', // Output to dist/client in the root
    emptyOutDir: true,
  },
  // Remove server.historyApiFallback as it's not needed for production build
});
