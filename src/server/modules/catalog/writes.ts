// Lo que escribe en el catálogo una lista, dentro de su transacción (diseño de 08, § 1; de 07, § 4 y
// § 5): cada escritura pone el precio con el paso de ahora (leído una vez por transacción, compartido)
// y anota qué productos tocó; al confirmar, `committed` pone al día el índice de búsqueda con ellos.
// Antes de crear, mira el tope de productos (07 · R3.5): si se pasaría, la lista no se aplica.
import type { Kysely, Transaction } from 'kysely';
import type { AfterCommit } from '../../platform/events.ts';
import {
  type CatalogTables,
  catalogData,
  type NewProduct,
  type ProductChange,
  type ProductCost,
} from './data.ts';
import { pricingData } from './data-pricing.ts';
import type { Priced } from './data-rows.ts';
import { catalogSettings } from './settings.ts';

// La lista crearía más productos que el tope: cuántos de más.
export class CatalogFull extends Error {
  readonly over: number;
  constructor(over: number) {
    super(`El catálogo se pasaría de ${catalogSettings.maxActive} productos por ${over}`);
    this.over = over;
  }
}

// Lo que tocó cada transacción: los productos y cuántos activos sumó (los creados y los que volvieron,
// menos los dados de baja); y el paso que leyó.
type Touched = { ids: Set<string>; added: number; step?: number };

export type Writes = ReturnType<typeof createWrites>;

const dataIn = (db: Kysely<unknown>) => catalogData(db as Kysely<CatalogTables>);
const pricingIn = (db: Kysely<unknown>) => pricingData(db as Kysely<CatalogTables>);

// Qué tocó cada transacción (se olvida al confirmar).
function createTracker() {
  const touched = new WeakMap<object, Touched>();
  const of = (trx: object): Touched => {
    const now = touched.get(trx) ?? { ids: new Set<string>(), added: 0 };
    touched.set(trx, now);
    return now;
  };
  const mark = (trx: object, ids: readonly string[], added = 0) => {
    const now = of(trx);
    for (const id of ids) now.ids.add(id);
    now.added += added;
  };
  const take = (trx: object): string[] => {
    const ids = [...of(trx).ids];
    touched.delete(trx);
    return ids;
  };
  return { of, mark, take };
}
type Tracker = ReturnType<typeof createTracker>;

// Lo que pone al día lo que trae una lista, con su precio y el tope de productos.
function listWrites(tracker: Tracker, active: () => number) {
  const { of, mark } = tracker;
  // Los precios de lo escrito, con el paso de esta transacción.
  const reprice = async (trx: Transaction<unknown>, rows: readonly Priced[]) => {
    const now = of(trx);
    now.step ??= await pricingIn(trx).stepForShare();
    await pricingIn(trx).reprice(rows, now.step);
    mark(
      trx,
      rows.map((row) => row.id),
    );
  };
  return {
    async create(trx: Transaction<unknown>, products: readonly NewProduct[]): Promise<void> {
      if (products.length === 0) return;
      const over = active() + of(trx).added + products.length - catalogSettings.maxActive;
      if (over > 0) throw new CatalogFull(over);
      await dataIn(trx).create(products);
      mark(
        trx,
        products.map((one) => one.id),
        products.length,
      );
    },
    async update(trx: Transaction<unknown>, changes: readonly ProductChange[]): Promise<void> {
      if (changes.length > 0) await reprice(trx, await dataIn(trx).update(changes));
    },
    async setCosts(trx: Transaction<unknown>, costs: readonly ProductCost[]): Promise<void> {
      if (costs.length > 0) await reprice(trx, await dataIn(trx).setCosts(costs));
    },
  };
}

// La baja de un proveedor y de los productos que nadie trae, y su vuelta.
const stateWrites = ({ mark }: Tracker) => ({
  async dropSupplier(trx: Transaction<unknown>, supplierId: string): Promise<void> {
    mark(
      trx,
      (await dataIn(trx).dropSupplier(supplierId)).map((row) => row.id),
    );
  },
  async discontinue(trx: Transaction<unknown>, ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    await dataIn(trx).setDiscontinued(ids, true);
    mark(trx, ids, -ids.length);
  },
  async restore(trx: Transaction<unknown>, ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    await dataIn(trx).setDiscontinued(ids, false);
    mark(trx, ids, ids.length);
  },
});

export function createWrites(deps: {
  active: () => number;
  refresh: (ids: string[]) => Promise<void>;
}) {
  const tracker = createTracker();
  // Las puestas al día del índice, de a una, en el orden en que se confirmaron.
  let refreshing = Promise.resolve();
  return {
    ...listWrites(tracker, deps.active),
    ...stateWrites(tracker),
    // Espera que el índice esté al día con lo confirmado.
    indexed: (): Promise<void> => refreshing,
    // Lo que corre después de confirmar: el índice, con lo que tocó la transacción.
    committed(trx: Transaction<unknown>): AfterCommit {
      const ids = tracker.take(trx);
      return () => {
        if (ids.length > 0) refreshing = refreshing.then(() => deps.refresh(ids));
      };
    },
  };
}
