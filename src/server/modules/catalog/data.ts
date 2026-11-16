// Las consultas de los productos (diseño de 08, § 1): todo en lote, con una sola sentencia por tanda,
// dentro de la transacción de quien llama. Las filas viajan como un JSON: un solo parámetro, sea
// cual sea el tamaño de la tanda.
import { type Kysely, type RawBuilder, sql } from 'kysely';
import type { DB } from './tables.generated.ts';

export type CatalogTables = DB;
type Db = Kysely<CatalogTables>;

// Los costos, en millonésimos, como texto: en un JSON un número tan grande pierde precisión.
const rowsOf = (rows: readonly object[]): RawBuilder<unknown> =>
  sql`${JSON.stringify(rows, (_key, value) => (typeof value === 'bigint' ? String(value) : value))}::jsonb`;

export type NewProduct = {
  id: string;
  description: string;
  brand: string | null;
  barcode: string | null;
  vat: number;
  cost: bigint;
  supplierId: string;
};

export type ProductChange = {
  id: string;
  description: string;
  brand: string | null;
  barcode: string | null;
  vat: number;
};

export type ProductCost = { id: string; cost: bigint | null; supplierId: string | null };

export type ProductRow = {
  id: string;
  description: string;
  brand: string | null;
  barcode: string | null;
  unit: string;
  vat: number;
  vatManual: boolean;
  cost: bigint | null;
  supplierId: string | null;
  discontinued: boolean;
};

export const catalogData = (db: Db) => ({
  async create(products: readonly NewProduct[]): Promise<void> {
    if (products.length === 0) return;
    await sql`
      insert into catalog.products (id, description, brand, barcode, vat, cost, cost_supplier_id)
      select id, description, brand, barcode, vat, cost, "supplierId"
      from jsonb_to_recordset(${rowsOf(products)}) as v(
        id uuid, description text, brand text, barcode text, vat smallint, cost bigint,
        "supplierId" uuid)`.execute(db);
  },

  // Lo que trae el artículo; el IVA, solo si nadie lo cambió a mano (R3.6, R7.3).
  async update(changes: readonly ProductChange[]): Promise<void> {
    if (changes.length === 0) return;
    await sql`
      update catalog.products p
      set description = v.description, brand = v.brand, barcode = v.barcode,
        vat = case when p.vat_manual then p.vat else v.vat end
      from jsonb_to_recordset(${rowsOf(changes)}) as v(
        id uuid, description text, brand text, barcode text, vat smallint)
      where p.id = v.id`.execute(db);
  },

  async setCosts(costs: readonly ProductCost[]): Promise<void> {
    if (costs.length === 0) return;
    await sql`
      update catalog.products p set cost = v.cost, cost_supplier_id = v."supplierId"
      from jsonb_to_recordset(${rowsOf(costs)}) as v(id uuid, cost bigint, "supplierId" uuid)
      where p.id = v.id`.execute(db);
  },

  async setDiscontinued(ids: readonly string[], discontinued: boolean): Promise<void> {
    if (ids.length === 0) return;
    await db.updateTable('catalog.products').set({ discontinued }).where('id', 'in', ids).execute();
  },

  read: async (ids: readonly string[]): Promise<ProductRow[]> =>
    ids.length === 0
      ? []
      : (
          await db
            .selectFrom('catalog.products')
            .select([
              'id',
              'description',
              'brand',
              'barcode',
              'unit',
              'vat',
              'vat_manual as vatManual',
              'cost',
              'cost_supplier_id as supplierId',
              'discontinued',
            ])
            .where('id', 'in', ids)
            .orderBy('id')
            .execute()
        ).map((row) => ({ ...row, cost: row.cost === null ? null : BigInt(row.cost) })),
});

export type CatalogData = ReturnType<typeof catalogData>;
