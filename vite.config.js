import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Test app config (the SPA at test-app/index.tsx used to develop the library
// against canonical or local data).
export default defineConfig({
  root: 'test-app',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../build',
    emptyOutDir: true,
  },
});
