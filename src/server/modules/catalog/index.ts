// La fachada del catálogo (08 · R7; diseño de 08, § 1): crear, poner al día, poner el costo, dar de
// baja y traer de vuelta productos en lote, dentro de la transacción de quien llama (ADR-001). No
// conoce a las listas de precios: las listas escriben acá, nunca al revés. En esta etapa no tiene
// rutas ni pantallas; 07 le suma el margen, el precio, la búsqueda y la ficha.
import type { Kysely, Transaction } from 'kysely';
import type { ServerModule } from '../../platform/modules.ts';
import {
  type CatalogTables,
  catalogData,
  type NewProduct,
  type ProductChange,
  type ProductCost,
  type ProductRow,
} from './data.ts';
import { createProducts } from './migrations/001-products.ts';

export type { NewProduct, ProductChange, ProductCost, ProductRow } from './data.ts';

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
  read(db: Kysely<unknown>, ids: readonly string[]): Promise<ProductRow[]>;
};

const dataIn = (db: Kysely<unknown>) => catalogData(db as Kysely<CatalogTables>);

export function createCatalogModule() {
  const module: ServerModule = {
    name: 'catalog',
    schema: { schema: 'catalog', migrations: { '001-products': createProducts } },
    register() {},
  };
  const catalog: Catalog = {
    create: (trx, products) => dataIn(trx).create(products),
    update: (trx, changes) => dataIn(trx).update(changes),
    setCosts: (trx, costs) => dataIn(trx).setCosts(costs),
    dropSupplier: (trx, supplierId) => dataIn(trx).dropSupplier(supplierId),
    discontinue: (trx, ids) => dataIn(trx).setDiscontinued(ids, true),
    restore: (trx, ids) => dataIn(trx).setDiscontinued(ids, false),
    read: (db, ids) => dataIn(db).read(ids),
  };
  return { module, catalog };
}
