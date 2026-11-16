// Las filas leídas de una lista (diseño de 08, § 2): se guardan de a bloques, cada uno en una sola
// sentencia, y se les pone el costo cuando se sabe de quién es la lista.
import { sql } from 'kysely';
import type { ProductRow, SkippedRow } from '../rules/check.ts';
import type { PricedRow, RowToPrice } from '../rules/pricing.ts';
import { bigText, type Db, jsonOf } from './db.ts';

// Guardar las filas leídas.
const writes = (db: Db) => ({
  async insert(listId: string, products: readonly ProductRow[], skipped: readonly SkippedRow[]) {
    const rows = [
      ...products.map((one) => ({
        ...{ sheet: one.sheet, row: one.row, code: one.code, description: one.description },
        ...{ brand: one.brand, barcode: one.barcode, key: one.searchKey },
        ...{ price: one.listPrice, vat: one.vat },
      })),
      ...skipped.map((one) => ({
        ...{ sheet: one.sheet, row: one.row, code: one.code, description: one.description },
        ...{ skipped: one.reason, cells: one.cells },
      })),
    ];
    // Un bloque sin productos ni salteadas no inserta nada.
    await sql`
      insert into price_lists.list_rows (list_id, sheet, row, supplier_code, description, brand,
        barcode, search_key, list_price, vat, skipped, cells)
      select ${listId}, sheet, row, left(code, 60), description, brand, barcode, key, price, vat,
        skipped, cells
      from jsonb_to_recordset(${jsonOf(rows)}) as v(sheet smallint, row integer, code text,
        description text, brand text, barcode text, key text, price bigint, vat smallint,
        skipped text, cells jsonb)`.execute(db);
  },
});

// Ponerles el costo y borrarlas.
const reads = (db: Db) => ({
  // Los productos de la lista, de a tandas y en orden, desde la fila que sigue a `after`.
  toPrice: async (listId: string, after: [number, number], limit: number): Promise<RowToPrice[]> =>
    (
      await sql<{
        sheet: number;
        row: number;
        code: string;
        price: string;
        vat: number | null;
        brand: string | null;
      }>`
        select sheet, row, supplier_code as code, list_price::text as price, vat, brand
        from price_lists.list_rows
        where list_id = ${listId} and list_price is not null and (sheet, row) > (${after[0]}, ${after[1]})
        order by sheet, row limit ${limit}`.execute(db)
    ).rows.map(({ price, ...one }) => ({ ...one, listPrice: BigInt(price) })),

  // El costo de hoy de los artículos del proveedor con esos códigos (R6.3: el que tenían).
  previousCosts: async (
    supplierId: string,
    codes: readonly string[],
  ): Promise<Map<string, bigint>> =>
    new Map(
      codes.length === 0
        ? []
        : (
            await db
              .selectFrom('price_lists.items')
              .select(['supplier_code', bigText('cost').as('cost')])
              .where('supplier_id', '=', supplierId)
              .where('supplier_code', 'in', codes)
              .execute()
          ).map((item) => [item.supplier_code, BigInt(item.cost)]),
    ),

  // Una tanda; vacía, no cambia nada.
  async savePrices(listId: string, rows: readonly PricedRow[]): Promise<void> {
    await sql`
      update price_lists.list_rows r
      set cost = v.cost, basis = v.basis, previous_cost = v.previous, change = v.change
      from jsonb_to_recordset(${jsonOf(rows)}) as v(sheet smallint, row integer, cost bigint,
        basis jsonb, previous bigint, change text)
      where r.list_id = ${listId} and r.sheet = v.sheet and r.row = v.row`.execute(db);
  },

  async clear(listId: string): Promise<void> {
    await db.deleteFrom('price_lists.list_rows').where('list_id', '=', listId).execute();
  },
});

export const rowsData = (db: Db) => ({ ...writes(db), ...reads(db) });
