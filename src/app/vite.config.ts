// Arma la aplicación (ADR-013): Preact con Vite; en desarrollo, /api va al servidor local. El manual
// se arma desde docs/manual/ con tools/manual/ (diseño del manual, § 2): en /manual/ del armado y,
// en desarrollo, servido desde la memoria. Con MANUAL_MEDIA=pending no se arma (para sacar sus
// capturas, que no lo muestran).
import { join } from 'node:path';
import preact from '@preact/preset-vite';
import { defineConfig, type Plugin } from 'vite';
import { buildManual } from '../../tools/manual/build.ts';
import { manualIcons } from './modules/manual/icons.ts';

const version = process.env.VERSION ?? 'dev';

function manual(): Plugin {
  const files = () => {
    const dir = join(import.meta.dirname, '../../docs/manual');
    const built = buildManual(dir, version, new Set(Object.keys(manualIcons)));
    if (built.problems.length > 0) throw new Error(`El manual:\n${built.problems.join('\n')}`);
    return built.files;
  };
  return {
    name: 'ferrebress-manual',
    generateBundle() {
      if (process.env.MANUAL_MEDIA === 'pending') return;
      for (const [name, source] of files())
        this.emitFile({ type: 'asset', fileName: `manual/${name}`, source });
    },
    configureServer(server) {
      server.middlewares.use('/manual/', (request, response) => {
        const file = files().get((request.url ?? '').slice(1).split('?')[0] ?? '');
        response.statusCode = file ? 200 : 404;
        response.setHeader('Cache-Control', 'no-store');
        response.end(file);
      });
    },
  };
}

export default defineConfig({
  plugins: [preact(), manual()],
  define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(version) },
  // Dos páginas: la aplicación y el marco del botón de Google. El service worker se arma aparte, como
  // /sw.js: su dirección no puede cambiar con cada versión.
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    target: 'es2022',
    rollupOptions: {
      input: { main: 'index.html', google: 'google-button.html', sw: 'sw.ts' },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js'),
        // El código del manual vive en /manual/, que el service worker no guarda (diseño del
        // manual, § 4).
        chunkFileNames: (chunk) =>
          chunk.facadeModuleId?.includes('/modules/manual/screens/Manual/')
            ? 'manual/app-[hash].js'
            : 'assets/[name]-[hash].js',
        assetFileNames: (asset) =>
          asset.names.includes('Manual.css')
            ? 'manual/app-[hash][extname]'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
