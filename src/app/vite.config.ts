// Arma la aplicación (ADR-013): Preact con Vite; en desarrollo, /api va al servidor local.
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [preact()],
  define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VERSION ?? 'dev') },
  // El service worker se arma aparte, como /sw.js: su dirección no puede cambiar con cada versión.
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2022',
    rollupOptions: {
      input: { main: 'index.html', sw: 'sw.ts' },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
