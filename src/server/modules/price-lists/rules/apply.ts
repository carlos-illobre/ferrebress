// Lo que hace una tanda de una lista al aplicarse (08 · R7.1 a R7.5), sin tecnología: un código nuevo
// crea su producto; uno que había se pone al día con lo que dice la lista y su costo, si cambió; uno
// dado de baja vuelve. De cada producto que se crea o cambia de costo queda el anterior y el nuevo, para
// Quién hizo qué (R9.1); uno con el mismo costo no suma nada (E77).
import { searchKey } from '@ferrebress/shared/text/search-key';
import type { ItemWrite, KnownItem, RowToApply } from '../data/apply.ts';

export type CostChange = { productId: string; before: string | null; after: string | null };

export type Batch = {
  items: ItemWrite[];
  created: {
    id: string;
    description: string;
    brand: string | null;
    barcode: string | null;
    vat: number;
    cost: bigint;
  }[];
  updated: {
    id: string;
    description: string;
    brand: string | null;
    barcode: string | null;
    vat: number;
  }[];
  costs: { id: string; cost: bigint }[];
  restored: string[];
  changes: CostChange[];
};

export function batchOf(
  rows: readonly RowToApply[],
  known: ReadonlyMap<string, KnownItem>,
  defaultVat: number,
  newId: () => string,
): Batch {
  const batch: Batch = {
    items: [],
    created: [],
    updated: [],
    costs: [],
    restored: [],
    changes: [],
  };
  for (const row of rows) {
    const had = known.get(row.code);
    const productId = had?.productId ?? newId();
    const fields = {
      description: row.description,
      brand: row.brand,
      barcode: row.barcode,
      vat: row.vat ?? defaultVat,
    };
    const cost = BigInt(row.cost);
    batch.items.push({
      ...{ code: row.code, productId, ...fields, cost, basis: row.basis },
      key: searchKey(`${row.description} ${row.code} ${row.brand ?? ''}`),
    });
    if (had) existing(batch, had, { id: productId, ...fields }, row.cost);
    else {
      batch.created.push({ id: productId, ...fields, cost });
      batch.changes.push({ productId, before: null, after: row.cost });
    }
  }
  return batch;
}

// Uno que había: se pone al día; si estaba dado de baja, vuelve (R7.5); su costo, si cambió (R7.3).
function existing(batch: Batch, had: KnownItem, product: Batch['updated'][number], cost: string) {
  batch.updated.push(product);
  if (had.discontinued) batch.restored.push(product.id);
  if (had.cost !== cost || had.discontinued)
    batch.costs.push({ id: product.id, cost: BigInt(cost) });
  if (had.cost !== cost)
    batch.changes.push({ productId: product.id, before: had.cost, after: cost });
}

// Partir una lista en tandas: lo que va a Quién hizo qué, de a tandas que entran en un evento (diseño
// de 05, § 2.2), y lo que se cambia en la base de a tandas.
export const chunksOf = <T>(list: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) =>
    list.slice(i * size, (i + 1) * size),
  );
