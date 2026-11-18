// Las consultas que escriben productos (diseño de 08, § 1; de 07, § 2 y § 4): todo en lote, con una
// sentencia por tanda, dentro de la transacción de quien llama. Las filas viajan como un JSON: un solo
// parámetro, sea cual sea el tamaño de la tanda. Lo que cambia el costo o el IVA devuelve con qué
// recalcular el precio (data-pricing.ts).
import { searchKey } from '@ferrebress/shared/text/search-key';
import { type Kysely, type RawBuilder, sql } from 'kysely';
import { type Priced, rowsOf } from './data-rows.ts';
import type { DB } from './tables.generated.ts';

export type CatalogTables = DB;
type Db = Kysely<CatalogTables>;

// Lo que hace falta para calcular el precio de lo que se escribió.
const pricedOf = sql`p.id, p.cost::text as cost, p.margin, p.vat`;
const rowsBack = async (query: RawBuilder<Priced>, db: Db) => (await query.execute(db)).rows;

export type NewProduct = {
  id: string;
  // El código del artículo en la lista de su proveedor (07 · R1.1).
  code: string;
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

const keyed = <T extends { description: string }>(rows: readonly T[]) =>
  rows.map((row) => ({ ...row, key: searchKey(row.description) }));

// Crear y poner al día lo que trae una lista.
const writes = (db: Db) => ({
  // Un producto nuevo no tiene margen: no tiene precio (08 · R7.2).
  async create(products: readonly NewProduct[]): Promise<void> {
    await sql`
      insert into catalog.products (id, supplier_code, description, brand, barcode, vat,
        vat_from_list, cost, cost_supplier_id, search_key)
      select id, code, description, brand, barcode, vat, vat, cost, "supplierId", key
      from jsonb_to_recordset(${rowsOf(keyed(products))}) as v(
        id uuid, code text, description text, brand text, barcode text, vat smallint, cost bigint,
        "supplierId" uuid, key text)`.execute(db);
  },

  // Lo que trae el artículo; el IVA, solo si nadie lo cambió a mano (R3.6, R7.3). El de la lista se
  // guarda siempre, para que «Deshacer» un IVA a mano vuelva a él (07 · R1.4).
  update: (changes: readonly ProductChange[]): Promise<Priced[]> =>
    rowsBack(
      sql<Priced>`
        update catalog.products p
        set description = v.description, brand = v.brand, barcode = v.barcode, search_key = v.key,
          vat_from_list = v.vat, vat = case when p.vat_manual then p.vat else v.vat end
        from jsonb_to_recordset(${rowsOf(keyed(changes))}) as v(
          id uuid, description text, brand text, barcode text, vat smallint, key text)
        where p.id = v.id
        returning ${pricedOf}`,
      db,
    ),

  setCosts: (costs: readonly ProductCost[]): Promise<Priced[]> =>
    rowsBack(
      sql<Priced>`
        update catalog.products p set cost = v.cost, cost_supplier_id = v."supplierId"
        from jsonb_to_recordset(${rowsOf(costs)}) as v(id uuid, cost bigint, "supplierId" uuid)
        where p.id = v.id
        returning ${pricedOf}`,
      db,
    ),
});

// El costo de un proveedor, la baja y leerlos.
const states = (db: Db) => ({
  // Sin el costo de ese proveedor (se lo dio de baja, R2.4): sin costo, sin precio (07 · R2.4).
  dropSupplier: (supplierId: string): Promise<Priced[]> =>
    rowsBack(
      sql<Priced>`
        update catalog.products p
        set cost = null, cost_supplier_id = null, raw_cents = null, sale_cents = null
        where cost_supplier_id = ${supplierId}
        returning ${pricedOf}`,
      db,
    ),

  async setDiscontinued(ids: readonly string[], discontinued: boolean): Promise<void> {
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
              sql<string | null>`cost::text`.as('cost'),
              'cost_supplier_id as supplierId',
              'discontinued',
            ])
            .where('id', 'in', ids)
            .orderBy('id')
            .execute()
        ).map((row) => ({ ...row, cost: row.cost === null ? null : BigInt(row.cost) })),
});

export const catalogData = (db: Db) => ({ ...writes(db), ...states(db) });

export type CatalogData = ReturnType<typeof catalogData>;
