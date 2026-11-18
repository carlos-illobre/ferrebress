// La marca como clave, para filtrar los dados de baja en la base (07 · R1.6), y el IVA de la lista de
// los productos con el IVA cambiado a mano: 002 copiaba el de ahora, que es el puesto a mano, y
// «Deshacer» tiene que volver al que pone la lista (R1.4).
import { searchKey } from '@ferrebress/shared/text/search-key';
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

const batch = 1000;

async function fillBrandKeys(db: Kysely<unknown>) {
  for (let after = ''; ; ) {
    const rows = (
      await sql<{ id: string; brand: string }>`
        select id, brand from catalog.products where brand is not null and id::text > ${after}
        order by id::text limit ${batch}`.execute(db)
    ).rows;
    if (rows.length === 0) return;
    const keys = rows.map((row) => ({ id: row.id, key: searchKey(row.brand) }));
    await sql`
      update catalog.products p set brand_key = v.key
      from jsonb_to_recordset(${JSON.stringify(keys)}::jsonb) as v(id uuid, key text)
      where p.id = v.id`.execute(db);
    after = (rows.at(-1) as { id: string }).id;
  }
}

export const addBrandKey: Migration = {
  async up(db: Kysely<unknown>) {
    await sql`alter table catalog.products add column brand_key text`.execute(db);
    await fillBrandKeys(db);
    await sql`
      do $$ begin
        if to_regclass('price_lists.items') is not null then
          update catalog.products p set vat_from_list = i.vat
          from price_lists.items i where i.product_id = p.id and p.vat_manual;
        end if;
      end $$`.execute(db);
  },
};
