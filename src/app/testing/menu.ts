// Para las pruebas del marco que se escribieron con Catálogo en «Pronto» y Usuarios como la primera
// opción que existe: esconde la pantalla de Catálogo mientras corren. Que la aplicación abre en
// Catálogo (00 · R1.4) lo prueba catalog-first.test.tsx.
import { afterEach, beforeEach } from 'vitest';
import { parts } from '../modules/frame/index.ts';

export function withoutCatalog() {
  const catalog = parts.find((option) => option.id === 'catalog') as { path?: string };
  const path = catalog.path as string;
  beforeEach(() => {
    delete catalog.path;
  });
  afterEach(() => {
    catalog.path = path;
  });
}
