// Las consultas de aplicar una lista (08 · R7; diseño de 08, § 1): de a tandas, cada una en pocas
// sentencias, dentro de la transacción que aplica.
import type { CostBasis } from '@ferrebress/shared/pricing/basis';
import { sql } from 'kysely';
import { type Db, jsonOf } from './db.ts';

export type RowToApply = {
  sheet: number;
  row: number;
  code: string;
  description: string;
  brand: string | null;
  barcode: string | null;
  vat: number | null;
  cost: string;
  basis: CostBasis;
};

export type KnownItem = { code: string; productId: string; cost: string; discontinued: boolean };

export type ItemWrite = {
  code: string;
  productId: string;
  description: string;
  brand: string | null;
  barcode: string | null;
  key: string;
  vat: number;
  cost: bigint;
  basis: CostBasis;
};

export const applyData = (db: Db) => ({
  // Los productos leídos de la lista, de a tandas y en orden.
  rows: async (listId: string, after: [number, number], limit: number): Promise<RowToApply[]> =>
    (
      await sql<RowToApply>`
        select sheet, row, supplier_code as code, description, brand, barcode, vat,
          cost::text as cost, basis
        from price_lists.list_rows
        where list_id = ${listId} and list_price is not null and (sheet, row) > (${after[0]}, ${after[1]})
        order by sheet, row limit ${limit}`.execute(db)
    ).rows,

  // Los artículos que el proveedor ya tenía con esos códigos (R7.1).
  known: async (supplierId: string, codes: readonly string[]): Promise<KnownItem[]> =>
    (
      await sql<KnownItem>`
        select supplier_code as code, product_id as "productId", cost::text as cost, discontinued
        from price_lists.items where supplier_id = ${supplierId} and supplier_code = any(${codes}::text[])`.execute(
        db,
      )
    ).rows,

  // Lo que dice la lista, en sus artículos: los nuevos se crean y los que había se ponen al día.
  async write(supplierId: string, listId: string, items: readonly ItemWrite[]): Promise<void> {
    await sql`
      insert into price_lists.items (supplier_id, supplier_code, product_id, description, brand,
        barcode, search_key, vat, cost, basis, list_id, discontinued, discontinued_list_id)
      select ${supplierId}, code, "productId", description, brand, barcode, key, vat, cost, basis,
        ${listId}, false, null
      from jsonb_to_recordset(${jsonOf(items)}) as v(code text, "productId" uuid, description text,
        brand text, barcode text, key text, vat smallint, cost bigint, basis jsonb)
      on conflict (supplier_id, supplier_code) do update set description = excluded.description,
        brand = excluded.brand, barcode = excluded.barcode, search_key = excluded.search_key,
        vat = excluded.vat, cost = excluded.cost, basis = excluded.basis, list_id = excluded.list_id,
        discontinued = false, discontinued_list_id = null`.execute(db);
  },

  // Los que la lista completa no trajo dejan de venir (R7.4).
  gone: async (
    supplierId: string,
    listId: string,
  ): Promise<{ productId: string; cost: string }[]> =>
    (
      await sql<{ productId: string; cost: string }>`
        update price_lists.items set discontinued = true, discontinued_list_id = ${listId}
        where supplier_id = ${supplierId} and not discontinued and list_id <> ${listId}
        returning product_id as "productId", cost::text as cost`.execute(db)
    ).rows,

  // De esos productos, los que ningún otro proveedor activo trae.
  alone: async (supplierId: string, productIds: readonly string[]): Promise<string[]> =>
    (
      await sql<{ id: string }>`
        select p.id from unnest(${productIds}::uuid[]) as p(id)
        where not exists (select 1 from price_lists.items o
          join price_lists.suppliers s on s.id = o.supplier_id
          where o.product_id = p.id and o.supplier_id <> ${supplierId} and not o.discontinued
            and not s.inactive)`.execute(db)
    ).rows.map((row) => row.id),
});
