// La fachada de las listas de precios (capítulo 08; diseño de 08): los proveedores, cómo cobra cada
// uno, sus listas y sus artículos. Escribe en el catálogo y abre y cierra anomalías por sus fachadas,
// dentro de su transacción; no conoce a nadie más. Las recibe en server/modules.ts.
import type { ServerModule } from '../../platform/modules.ts';
import { createPriceListsContext, type PriceListsDependencies } from './context.ts';
import { createSuppliers } from './migrations/001-suppliers.ts';
import { createLists } from './migrations/002-lists.ts';
import { createItems } from './migrations/003-items.ts';
import { registerSupplierRoutes } from './routes/suppliers.ts';

export type { PriceListsDependencies } from './context.ts';

export function createPriceListsModule(dependencies: PriceListsDependencies) {
  const module: ServerModule = {
    name: 'price-lists',
    schema: {
      schema: 'price_lists',
      migrations: {
        '001-suppliers': createSuppliers,
        '002-lists': createLists,
        '003-items': createItems,
      },
    },
    register(platform) {
      const ctx = createPriceListsContext(platform, dependencies);
      registerSupplierRoutes(ctx);
    },
  };
  return { module };
}
