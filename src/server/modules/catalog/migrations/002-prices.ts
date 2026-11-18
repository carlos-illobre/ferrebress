// El precio, el código del proveedor y la clave de orden de cada producto (07 · R1, R2; diseño de 07,
// § 2), y la fila con el paso del redondeo que usan todos los precios. Los productos que ya había
// toman el código de su artículo en las listas y su descripción como clave; ninguno tiene margen,
// así que ninguno tiene precio todavía.
import { searchKey } from '@ferrebress/shared/text/search-key';
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

const batch = 1000;

// La clave de cada descripción se arma acá, con la misma función que usa el servidor al escribir.
async function fillKeys(db: Kysely<unknown>) {
  for (let after = ''; ; ) {
    const rows = (
      await sql<{ id: string; description: string }>`
        select id, description from catalog.products where id::text > ${after}
        order by id::text limit ${batch}`.execute(db)
    ).rows;
    if (rows.length === 0) return;
    const keys = rows.map((row) => ({ id: row.id, key: searchKey(row.description) }));
    await sql`
      update catalog.products p set search_key = v.key
      from jsonb_to_recordset(${JSON.stringify(keys)}::jsonb) as v(id uuid, key text)
      where p.id = v.id`.execute(db);
    after = (rows.at(-1) as { id: string }).id;
  }
}

export const addPrices: Migration = {
  async up(db: Kysely<unknown>) {
    await sql`
      alter table catalog.products
        add column supplier_code text not null default '',
        add column margin integer check (margin between 1 and 10000),
        add column raw_cents bigint check (raw_cents >= 0),
        add column sale_cents bigint check (sale_cents >= 0),
        add column vat_from_list smallint,
        add column search_key text not null default ''`.execute(db);
    await sql`update catalog.products set vat_from_list = vat`.execute(db);
    await sql`alter table catalog.products alter column vat_from_list set not null`.execute(db);
    // En una base nueva las listas todavía no tienen tabla: no hay productos que completar.
    await sql`
      do $$ begin
        if to_regclass('price_lists.items') is not null then
          update catalog.products p set supplier_code = i.supplier_code
          from price_lists.items i where i.product_id = p.id;
        end if;
      end $$`.execute(db);
    await fillKeys(db);
    await sql`
      create index products_discontinued_key on catalog.products
        (discontinued, search_key collate "C", id)`.execute(db);
    await sql`
      create table catalog.pricing (
        id boolean primary key default true check (id),
        step_cents integer not null check (step_cents > 0))`.execute(db);
  },
};
