// Cambiar un dato de un producto (07 · R1.4, R2.7): una sentencia, que guarda también el precio nuevo y
// devuelve el producto como quedó. La fila ya está trabada por quien cambia (`one(id, true)`).
import { type Kysely, sql } from 'kysely';
import type { CatalogTables } from './data.ts';
import { columns, type StoredProduct } from './data-pages.ts';
import type { ProductWrite } from './rules/changes.ts';

type Prices = { raw: bigint | null; sale: bigint | null };

const setOf = (write: ProductWrite) => {
  if (write.kind === 'margin') return sql`margin = ${write.margin}`;
  if (write.kind === 'unit') return sql`unit = ${write.unit}, unit_manual = true`;
  return sql`vat = ${write.vat}, vat_manual = ${write.manual}`;
};

export const changesData = (db: Kysely<CatalogTables>) => ({
  async write(id: string, write: ProductWrite, prices: Prices): Promise<StoredProduct> {
    const { rows } = await sql<StoredProduct>`
      update catalog.products set ${setOf(write)},
        raw_cents = ${prices.raw?.toString() ?? null}, sale_cents = ${prices.sale?.toString() ?? null}
      where id = ${id}
      returning ${columns}`.execute(db);
    return rows[0] as StoredProduct;
  },
});
