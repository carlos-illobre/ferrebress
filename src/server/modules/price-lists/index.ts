// La fachada de las listas de precios (capítulo 08; diseño de 08): los proveedores, cómo cobra cada
// uno, sus listas, sus lectores y sus artículos. Escribe en el catálogo y abre y cierra anomalías por
// sus fachadas, dentro de su transacción; no conoce a nadie más. Las recibe en server/modules.ts.
import type { ServerModule } from '../../platform/modules.ts';
import { createPriceListsContext, type PriceListsDependencies } from './context.ts';
import { createSuppliers } from './migrations/001-suppliers.ts';
import { createLists } from './migrations/002-lists.ts';
import { createItems } from './migrations/003-items.ts';
import { createReaders } from './migrations/004-readers.ts';
import { createReadingPool, type ReadingPool } from './reading/pool.ts';
import { programmerReaders, resume } from './reading/resume.ts';
import { createReading, type Reading } from './reading/service.ts';
import { registerListTopic } from './realtime.ts';
import { registerListRoutes } from './routes/lists.ts';
import { registerSupplierRoutes } from './routes/suppliers.ts';
import { priceListsSettings } from './settings.ts';

export type { PriceListsDependencies } from './context.ts';

export type PriceListsOptions = {
  // Dónde están los lectores de un programador; las pruebas pasan la suya.
  readersDir?: URL;
};

export function createPriceListsModule(
  dependencies: PriceListsDependencies,
  options: PriceListsOptions = {},
) {
  let reading: Reading | undefined;
  let resumed: (() => Promise<void>) | undefined;
  const module: ServerModule = {
    name: 'price-lists',
    schema: {
      schema: 'price_lists',
      migrations: {
        '001-suppliers': createSuppliers,
        '002-lists': createLists,
        '003-items': createItems,
        '004-readers': createReaders,
      },
    },
    async register(platform) {
      const ctx = createPriceListsContext(platform, dependencies);
      // Los procesos lectores arrancan con la primera lista que hay que leer.
      let pool: ReadingPool | undefined;
      reading = createReading(ctx, {
        pool: () => {
          pool ??= createReadingPool(priceListsSettings.pool);
          return pool;
        },
        publish: registerListTopic(platform),
      });
      platform.onClose(async () => pool?.close());
      registerSupplierRoutes(ctx, reading);
      registerListRoutes(ctx, reading);
      const dir = options.readersDir ?? new URL('./readers/', import.meta.url);
      const given = reading;
      resumed = () => resume(ctx, given, programmerReaders(dir));
      await resumed();
    },
  };
  const priceLists = {
    // Espera que terminen las lecturas en curso.
    idle: (): Promise<void> => (reading as Reading).idle(),
    // Vuelve a leer una lista que se está leyendo; una que no, queda como está.
    read: (listId: string): Promise<void> => (reading as Reading).start(listId),
    // Lo que se hace al arrancar (diseño de 08, § 8): las pruebas lo repiten como si se reiniciara.
    resume: (): Promise<void> => (resumed as () => Promise<void>)(),
  };
  return { module, priceLists };
}
