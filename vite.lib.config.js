import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Bundles the library at src/lib/index.js into dist/index.js + dist/index.css.
// Run via `npm run build:lib` (which `npm pack` invokes through `prepack`).
//
// Peer-dep packages must be left as external imports; the consumer provides
// them at install time.
const peerExternals = [
  'react',
  'react-dom',
  'd3',
  'rc-switch',
  'usehooks-ts',
];

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, 'src/lib/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: (id) => peerExternals.some(
        (dep) => id === dep || id.startsWith(`${dep}/`)
      ),
      output: {
        assetFileNames: (asset) => asset.name?.endsWith('.css') ? 'index.css' : 'assets/[name][extname]',
      },
    },
  },
});
