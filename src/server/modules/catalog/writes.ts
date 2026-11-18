// Lo que escribe en el catálogo una lista, dentro de su transacción (diseño de 08, § 1; de 07, § 4 y
// § 5). La primera escritura de cada transacción lee el paso del redondeo compartido, antes de trabar
// ningún producto: así una lista y el recálculo del redondeo se esperan en vez de trabarse entre ellos.
// Cada escritura pone el precio con ese paso y anota qué productos tocó; al confirmar, `committed` los
// pone en la cola del índice de búsqueda. Lo que suma productos activos (crear, traer de vuelta) mira
// el tope (07 · R3.5) con lo que cuenta la base: si se pasaría, la lista no se aplica.
import type { Kysely, Transaction } from 'kysely';
import type { AfterCommit } from '../../platform/events.ts';
import { pricingData } from './data/pricing.ts';
import {
  type CatalogTables,
  catalogData,
  type NewProduct,
  type ProductChange,
  type ProductCost,
} from './data/products.ts';
import type { Priced } from './data/rows.ts';
import { catalogSettings } from './settings.ts';

// La lista dejaría más productos activos que el tope: cuántos de más.
export class CatalogFull extends Error {
  readonly over: number;
  constructor(over: number) {
    super(`El catálogo se pasaría de ${catalogSettings.maxActive} productos por ${over}`);
    this.over = over;
  }
}

// Lo que sabe cada transacción: los productos que tocó, el paso que leyó y, desde que hizo falta,
// cuántos activos hay contando lo suyo.
type Touched = { ids: Set<string>; step: number; active?: number };

export type Writes = ReturnType<typeof createWrites>;

const dataIn = (db: Kysely<unknown>) => catalogData(db as Kysely<CatalogTables>);
const pricingIn = (db: Kysely<unknown>) => pricingData(db as Kysely<CatalogTables>);

// Qué sabe cada transacción (se olvida al confirmar).
function createTracker() {
  const touched = new WeakMap<object, Touched>();
  // Al empezar a escribir, el paso.
  const begin = async (trx: Transaction<unknown>): Promise<Touched> => {
    const known = touched.get(trx);
    if (known) return known;
    const now = { ids: new Set<string>(), step: await pricingIn(trx).stepForShare() };
    touched.set(trx, now);
    return now;
  };
  const mark = (now: Touched, ids: readonly string[]) => {
    for (const id of ids) now.ids.add(id);
  };
  // Cuántos activos hay contando lo de esta transacción: la base, la primera vez, antes de escribir.
  const active = async (trx: Transaction<unknown>, now: Touched): Promise<number> => {
    now.active ??= await dataIn(trx).activeCount();
    return now.active;
  };
  // Suma activos; si se pasa del tope, lanza.
  const add = (now: Touched, added: number) => {
    now.active = (now.active as number) + added;
    const over = now.active - catalogSettings.maxActive;
    if (over > 0) throw new CatalogFull(over);
  };
  const take = (trx: object): string[] => {
    const ids = [...(touched.get(trx)?.ids ?? [])];
    touched.delete(trx);
    return ids;
  };
  return { begin, mark, active, add, take };
}
type Tracker = ReturnType<typeof createTracker>;

// Lo que pone al día lo que trae una lista, con su precio y el tope de productos.
function listWrites({ begin, mark, active, add }: Tracker) {
  // Los precios de lo escrito, con el paso de esta transacción.
  const reprice = async (trx: Transaction<unknown>, write: () => Promise<Priced[]>) => {
    const now = await begin(trx);
    const rows = await write();
    await pricingIn(trx).reprice(rows, now.step);
    mark(
      now,
      rows.map((row) => row.id),
    );
  };
  return {
    async create(trx: Transaction<unknown>, products: readonly NewProduct[]): Promise<void> {
      if (products.length === 0) return;
      const now = await begin(trx);
      await active(trx, now);
      add(now, products.length);
      await dataIn(trx).create(products);
      mark(
        now,
        products.map((one) => one.id),
      );
    },
    async update(trx: Transaction<unknown>, changes: readonly ProductChange[]): Promise<void> {
      if (changes.length > 0) await reprice(trx, () => dataIn(trx).update(changes));
    },
    async setCosts(trx: Transaction<unknown>, costs: readonly ProductCost[]): Promise<void> {
      if (costs.length > 0) await reprice(trx, () => dataIn(trx).setCosts(costs));
    },
  };
}

// La baja de un proveedor y de los productos que nadie trae, y su vuelta.
const stateWrites = ({ begin, mark, active, add }: Tracker) => ({
  async dropSupplier(trx: Transaction<unknown>, supplierId: string): Promise<void> {
    const now = await begin(trx);
    mark(
      now,
      (await dataIn(trx).dropSupplier(supplierId)).map((row) => row.id),
    );
  },
  async discontinue(trx: Transaction<unknown>, ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    const now = await begin(trx);
    const changed = await dataIn(trx).setDiscontinued(ids, true);
    if (now.active !== undefined) now.active -= changed;
    mark(now, ids);
  },
  // Volver también suma activos: mira el tope.
  async restore(trx: Transaction<unknown>, ids: readonly string[]): Promise<void> {
    if (ids.length === 0) return;
    const now = await begin(trx);
    await active(trx, now);
    add(now, await dataIn(trx).setDiscontinued(ids, false));
    mark(now, ids);
  },
});

export function createWrites(deps: { refresh: (ids: string[]) => Promise<void> }) {
  const tracker = createTracker();
  // Las puestas al día del índice, de a una y en el orden en que se confirmaron: así una nunca pisa
  // a otra más nueva. Una que falla no corta la cola.
  let refreshing = Promise.resolve();
  const queue = (ids: string[]) => {
    if (ids.length === 0) return;
    refreshing = refreshing.then(() => deps.refresh(ids)).catch(console.error);
  };
  return {
    ...listWrites(tracker),
    ...stateWrites(tracker),
    queue,
    // Espera que el índice esté al día con lo confirmado.
    indexed: (): Promise<void> => refreshing,
    // Lo que corre después de confirmar: el índice, con lo que tocó la transacción.
    committed(trx: Transaction<unknown>): AfterCommit {
      const ids = tracker.take(trx);
      return () => queue(ids);
    },
  };
}
