// La fachada de las listas de precios (capítulo 08; diseño de 08): los proveedores, cómo cobra cada
// uno, sus listas, sus lectores y sus artículos. Escribe en el catálogo y abre y cierra anomalías por
// sus fachadas, dentro de su transacción; no conoce a nadie más. Las recibe en server/modules.ts.
import type { Platform, ServerModule } from '../../platform/modules.ts';
import { type Applying, createApplying } from './apply/service.ts';
import { createPriceListsContext, type PriceListsDependencies } from './context.ts';
import { createSuppliers } from './migrations/001-suppliers.ts';
import { createLists } from './migrations/002-lists.ts';
import { createItems } from './migrations/003-items.ts';
import { createReaders } from './migrations/004-readers.ts';
import { createReadingPool, type ReadingPool } from './reading/pool.ts';
import { programmerReaders, resume } from './reading/resume.ts';
import { createReading, type Reading } from './reading/service.ts';
import { registerListTopic } from './realtime.ts';
import { registerHistoryRoutes } from './routes/history.ts';
import { registerListRoutes } from './routes/lists.ts';
import { registerSupplierRoutes } from './routes/suppliers.ts';
import { priceListsSettings } from './settings.ts';

export type { PriceListsDependencies } from './context.ts';

export type PriceListsOptions = {
  // Dónde están los lectores de un programador; las pruebas pasan la suya.
  readersDir?: URL;
};

type Running = { reading: Reading; applying: Applying; resume: () => Promise<void> };

// Lo que arranca con el servidor: los procesos lectores (con la primera lista que hay que leer), la
// lectura, aplicar, las rutas, y retomar lo cortado.
async function start(
  platform: Platform,
  dependencies: PriceListsDependencies,
  options: PriceListsOptions,
): Promise<Running> {
  const ctx = createPriceListsContext(platform, dependencies);
  let pool: ReadingPool | undefined;
  const topic = registerListTopic(platform);
  const reading = createReading(ctx, {
    pool: () => {
      pool ??= createReadingPool(priceListsSettings.pool);
      return pool;
    },
    publish: topic.publish,
  });
  const applying = createApplying(ctx, { reading, ...topic });
  platform.onClose(async () => pool?.close());
  registerSupplierRoutes(ctx, reading);
  registerListRoutes(ctx, reading, applying);
  registerHistoryRoutes(ctx);
  const dir = options.readersDir ?? new URL('./readers/', import.meta.url);
  const resumeNow = () => resume(ctx, reading, programmerReaders(dir));
  await resumeNow();
  return { reading, applying, resume: resumeNow };
}

export function createPriceListsModule(
  dependencies: PriceListsDependencies,
  options: PriceListsOptions = {},
) {
  let running: Running | undefined;
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
      running = await start(platform, dependencies, options);
    },
  };
  const priceLists = {
    // Espera que terminen las lecturas en curso.
    idle: async (): Promise<void> => {
      const { reading, applying } = running as Running;
      await reading.idle();
      await applying.idle();
      await reading.idle();
    },
    // Cancela una lista que se aplica (R4.11).
    cancelApply: (listId: string): boolean => (running as Running).applying.cancel(listId),
    // Vuelve a leer una lista que se está leyendo; una que no, queda como está.
    read: (listId: string): Promise<void> => (running as Running).reading.start(listId),
    // Lo que se hace al arrancar (diseño de 08, § 8): las pruebas lo repiten como si se reiniciara.
    resume: (): Promise<void> => (running as Running).resume(),
  };
  return { module, priceLists };
}
