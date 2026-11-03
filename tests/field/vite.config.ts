// Arma las pruebas de campo (diseño de 03, § 21, tarea 1) para publicarlas con el visor de maquetas
// en GitHub Pages, que da HTTPS en cualquier dispositivo. Las bibliotecas salen de la aplicación.
import { join } from 'node:path';

const app = join(import.meta.dirname, '../../src/app/node_modules');

// Sin importar vite: la configuración se lee desde acá, fuera del paquete de la aplicación.
export default {
  root: import.meta.dirname,
  base: './',
  resolve: {
    alias: {
      '@zxing/library': join(app, '@zxing/library'),
      'qrcode-generator': join(app, 'qrcode-generator'),
    },
  },
  build: {
    outDir: process.env.FIELD_OUT ?? join(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: { input: { peer: join(import.meta.dirname, 'peer/index.html') } },
  },
};
