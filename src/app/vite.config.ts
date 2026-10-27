// Arma la aplicación (ADR-013): Preact con Vite; en desarrollo, /api va al servidor local.
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [preact()],
  define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VERSION ?? 'dev') },
  build: { outDir: 'dist', assetsDir: 'assets', target: 'es2022' },
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
