import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Test app config (the SPA at src/index.js used to develop the library
// against canonical or local data).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'build',
    emptyOutDir: true,
  },
});
