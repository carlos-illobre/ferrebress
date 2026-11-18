// Las rutas del catálogo (diseño de 07, § 3): buscar y ver, y cambiar un producto.
import { registerChangeRoutes } from './changes.ts';
import { type CatalogDependencies, createRoutesContext } from './context.ts';
import { registerProductRoutes } from './products.ts';

export function registerRoutes(deps: CatalogDependencies): void {
  const ctx = createRoutesContext(deps);
  registerProductRoutes(ctx);
  registerChangeRoutes(ctx);
}
