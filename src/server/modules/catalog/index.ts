// La fachada del catálogo (07; 08 · R7; diseño de 07 y de 08, § 1): lo que hacen las listas con los
// productos, en lote y dentro de su transacción (ADR-001), que al confirmar pone al día el índice de
// búsqueda (`committed`); quien recalcula los precios cuando cambia el redondeo, para Administración;
// y las rutas de buscar, ver y cambiar un producto. No conoce a las listas de precios: la cuenta del
// costo le llega en `costSourceOf`, que conecta server/modules.ts.
import type { CostSource } from '@ferrebress/shared/contracts/catalog';
import { createSearchIndex } from '@ferrebress/shared/search/index';
import type { Kysely, Transaction } from 'kysely';
import type { AfterCommit } from '../../platform/events.ts';
import type { ServerModule } from '../../platform/modules.ts';
import type { PriceRecalculator } from '../administration/index.ts';
import {
  type CatalogTables,
  catalogData,
  type NewProduct,
  type ProductChange,
  type ProductCost,
  type ProductRow,
} from './data.ts';
import { pagesData } from './data-pages.ts';
import { pricingData } from './data-pricing.ts';
import { refresher } from './indexing.ts';
import { createProducts } from './migrations/001-products.ts';
import { addPrices } from './migrations/002-prices.ts';
import { createRecalculator } from './recalculator.ts';
import { registerRoutes } from './routes/index.ts';
import { createWrites } from './writes.ts';

export type { NewProduct, ProductChange, ProductCost, ProductRow } from './data.ts';
export { CatalogFull } from './writes.ts';

export type Catalog = {
  create(trx: Transaction<unknown>, products: readonly NewProduct[]): Promise<void>;
  update(trx: Transaction<unknown>, changes: readonly ProductChange[]): Promise<void>;
  setCosts(trx: Transaction<unknown>, costs: readonly ProductCost[]): Promise<void>;
  // Quita el costo que puso ese proveedor (se lo dio de baja, R2.4).
  dropSupplier(trx: Transaction<unknown>, supplierId: string): Promise<void>;
  // Ningún artículo lo trae (R7.4): conserva todo lo suyo (R7.5).
  discontinue(trx: Transaction<unknown>, ids: readonly string[]): Promise<void>;
  // Un artículo lo vuelve a traer.
  restore(trx: Transaction<unknown>, ids: readonly string[]): Promise<void>;
  // Lo que corre al confirmar la transacción: el índice de búsqueda, con lo que tocó.
  committed(trx: Transaction<unknown>): AfterCommit;
  // Espera que el índice de búsqueda esté al día con lo confirmado.
  indexed(): Promise<void>;
  read(db: Kysely<unknown>, ids: readonly string[]): Promise<ProductRow[]>;
};

export type CatalogOptions = {
  // De dónde sale el costo de un producto, de las listas de precios (07 · R2.6).
  costSourceOf: (productId: string) => Promise<CostSource | undefined>;
  // El paso del redondeo de Administración, para la primera vez.
  roundingStep: () => number;
};

const dbOf = (db: Kysely<unknown>) => db as Kysely<CatalogTables>;

export function createCatalogModule(options: CatalogOptions) {
  const index = createSearchIndex();
  let db: Kysely<CatalogTables>;
  const refresh = refresher(index, () => pagesData(db));
  const writes = createWrites({ active: index.size, refresh });
  const module: ServerModule = {
    name: 'catalog',
    schema: {
      schema: 'catalog',
      migrations: { '001-products': createProducts, '002-prices': addPrices },
    },
    async register(platform) {
      db = dbOf(platform.db);
      await pricingData(db).start(options.roundingStep());
      index.replace(await pagesData(db).docs(), []);
      registerRoutes({ platform, db, index, ...options });
    },
  };
  const catalog: Catalog = {
    ...writes,
    read: (on, ids) => catalogData(dbOf(on)).read(ids),
  };
  const recalculator: PriceRecalculator = createRecalculator(() => db as Kysely<unknown>);
  return { module, catalog, recalculator };
}
