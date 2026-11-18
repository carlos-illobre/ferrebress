// Las consultas que leen productos para buscar y mostrar (diseño de 07, § 3 y § 5): lo que guarda el
// índice, una página por sus identificadores (una consulta por clave) y los dados de baja, que no están
// en el índice, de a páginas por su clave de orden.
import type { SearchDoc } from '@ferrebress/shared/search/index';
import { type Kysely, sql } from 'kysely';
import type { CatalogTables } from './data.ts';

type Db = Kysely<CatalogTables>;

// Un producto como lo leen las rutas; la vista decide qué se muestra (rules/views.ts).
export type StoredProduct = {
  id: string;
  code: string;
  barcode: string | null;
  description: string;
  brand: string | null;
  unit: string;
  vat: number;
  vatManual: boolean;
  vatFromList: number;
  margin: number | null;
  cost: string | null;
  supplierId: string | null;
  raw: string | null;
  sale: string | null;
  discontinued: boolean;
  key: string;
};

export const columns = sql`id, supplier_code as code, barcode, description, brand, unit, vat,
  vat_manual as "vatManual", vat_from_list as "vatFromList", margin, cost::text as cost,
  cost_supplier_id as "supplierId", raw_cents::text as raw, sale_cents::text as sale, discontinued,
  search_key as key`;

type DocRow = Omit<SearchDoc, 'codes'> & {
  code: string;
  barcode: string | null;
  discontinued: boolean;
};
const docOf = ({ code, barcode, discontinued: _, ...doc }: DocRow): SearchDoc => ({
  ...doc,
  codes: barcode ? [code, barcode] : [code],
});
const docColumns = sql`id, description, brand, supplier_code as code, barcode,
  sale_cents is not null as priced, discontinued`;

export const pagesData = (db: Db) => ({
  // Lo que guarda el índice, de los que no están dados de baja.
  async docs(): Promise<SearchDoc[]> {
    const { rows } = await sql<DocRow>`
      select ${docColumns} from catalog.products where not discontinued`.execute(db);
    return rows.map(docOf);
  },

  // Los que cambió una transacción: los que siguen y los que se dieron de baja.
  async docsOf(ids: readonly string[]): Promise<{ changed: SearchDoc[]; gone: string[] }> {
    const { rows } = await sql<DocRow>`
      select ${docColumns} from catalog.products where id = any(${ids}::uuid[])`.execute(db);
    return {
      changed: rows.filter((row) => !row.discontinued).map(docOf),
      gone: rows.filter((row) => row.discontinued).map((row) => row.id),
    };
  },

  // Una página, en el orden de los identificadores que se piden.
  async byIds(ids: readonly string[]): Promise<StoredProduct[]> {
    if (ids.length === 0) return [];
    const { rows } = await sql<StoredProduct>`
      select ${columns} from catalog.products where id = any(${ids}::uuid[])`.execute(db);
    const order = new Map(ids.map((id, i) => [id, i]));
    return rows.sort((a, b) => (order.get(a.id) as number) - (order.get(b.id) as number));
  },

  // Los dados de baja, de a páginas, por su clave de orden (07 · R1.6). Uno de más dice si hay más.
  async discontinued(after: { key: string; id: string } | undefined, limit: number) {
    const from = after
      ? sql`and (search_key collate "C", id) > (${after.key}, ${after.id}::uuid)`
      : sql``;
    const { rows } = await sql<StoredProduct>`
      select ${columns} from catalog.products where discontinued ${from}
      order by search_key collate "C", id limit ${limit + 1}`.execute(db);
    return rows;
  },

  // Uno, para mostrarlo o para cambiarlo con la fila trabada.
  async one(id: string, lock = false): Promise<StoredProduct | undefined> {
    const forUpdate = lock ? sql`for update` : sql``;
    const { rows } = await sql<StoredProduct>`
      select ${columns} from catalog.products where id = ${id} ${forUpdate}`.execute(db);
    return rows[0];
  },
});
