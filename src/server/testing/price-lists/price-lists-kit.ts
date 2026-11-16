// Para probar las listas de precios desde la aplicación (capítulo 08): el kit de roles con personas
// que tienen los permisos del capítulo, y cómo dejar en la base artículos y una lista viva sin pasar
// por leer una planilla.
import type { Terms } from '@ferrebress/shared/contracts/price-lists';
import { costWith } from '@ferrebress/shared/pricing/basis';
import { type Kysely, sql } from 'kysely';
import type { Catalog } from '../../modules/catalog/index.ts';
import { createRolesKit, type RolesKit } from '../users/roles-kit.ts';

export type Article = { code: string; listPrice: bigint; brand?: string; vat?: number };
type Device = RolesKit['admin'];

const counter = () => {
  let ids = 0;
  return () => `0190b000-0000-7000-8000-${String(++ids).padStart(12, '0')}`;
};

const termsOf = async (admin: Device, id: string) =>
  (await admin.request(`/api/price-lists/suppliers/${id}`)).body as {
    terms: { value: Terms; version: number };
  };

// Artículos ya aplicados de un proveedor, cada uno con su producto y el costo de cómo cobra hoy.
async function addArticles(
  { db, catalog, uuid, admin }: Seed,
  supplierId: string,
  articles: Article[],
) {
  const { terms } = await termsOf(admin, supplierId);
  const listId = uuid();
  const listDate = '2026-08-14';
  const rows = articles.map((article) => ({
    ...article,
    productId: uuid(),
    ...costWith(
      {
        ...article,
        vat: article.vat ?? terms.value.defaultVat,
        brand: article.brand ?? null,
        listId,
        listDate,
      },
      terms.value,
    ),
  }));
  const products = rows.map((row) => ({
    ...{ id: row.productId, description: `Artículo ${row.code}`, brand: row.brand ?? null },
    ...{ barcode: null, vat: row.vat ?? 210, cost: row.cost, supplierId },
  }));
  await db.transaction().execute((trx) => catalog.create(trx, products));
  for (const row of rows)
    await sql`insert into price_lists.items (supplier_id, supplier_code, product_id, description,
      brand, search_key, vat, cost, basis, list_id) values (${supplierId}, ${row.code},
      ${row.productId}, ${`Artículo ${row.code}`}, ${row.brand ?? null}, ${row.code},
      ${row.vat ?? 210}, ${String(row.cost)}, ${JSON.stringify(row.basis)}::jsonb, ${listId})`.execute(
      db,
    );
  return rows;
}

// Una lista leída y en espera, con sus filas: lo que trae cada una y el costo anterior.
async function addPendingList(
  { db, uuid, adminId }: Seed,
  supplierId: string,
  rows: (Article & { previousCost?: bigint })[],
) {
  const listId = uuid();
  await sql`insert into price_lists.lists (id, supplier_id, supplier_confirmed, status, file_name,
    list_date, uploaded_by, uploaded_at) values (${listId}, ${supplierId}, true, 'pending',
    'lista.xlsx', '2026-09-01', ${adminId}, now())`.execute(db);
  let row = 0;
  for (const each of rows)
    await sql`insert into price_lists.list_rows (list_id, sheet, row, supplier_code, list_price,
      vat, brand, previous_cost) values (${listId}, 0, ${++row}, ${each.code},
      ${String(each.listPrice)}, ${each.vat ?? null}, ${each.brand ?? null},
      ${each.previousCost === undefined ? null : String(each.previousCost)})`.execute(db);
  return listId;
}

// Lo que quedó en la base, para mirarlo.
const lookAt = (db: Kysely<unknown>) => ({
  setListStatus: (listId: string, status: string) =>
    sql`update price_lists.lists set status = ${status} where id = ${listId}`.execute(db),
  itemCosts: async (supplierId: string) =>
    (
      await sql<{ code: string; cost: string; discontinued: boolean }>`select supplier_code as code,
        cost::text, discontinued from price_lists.items where supplier_id = ${supplierId}
        order by supplier_code`.execute(db)
    ).rows,
  rowCosts: async (listId: string) =>
    (
      await sql<{ cost: string | null; change: string | null }>`select cost::text, change from
        price_lists.list_rows where list_id = ${listId} order by row`.execute(db)
    ).rows,
  listStatus: async (listId: string) =>
    (
      await sql<{ status: string; reason: string | null }>`select status, reason from
        price_lists.lists where id = ${listId}`.execute(db)
    ).rows[0],
});

type Seed = {
  db: Kysely<unknown>;
  catalog: Catalog;
  uuid: () => string;
  admin: Device;
  adminId: string;
};

export async function createPriceListsKit() {
  const kit = await createRolesKit();
  const db = kit.server.platform.db;
  const as = async (name: string, permissions: string[]) =>
    kit.person([await kit.role(name, permissions)]);
  const seed: Seed = { db, catalog: kit.server.catalog, uuid: counter(), ...kit };
  return {
    ...kit,
    ...lookAt(db),
    seller: await as('Mostrador', ['users.view']),
    viewer: await as('Costos', ['price-lists.costs']),
    manager: await as('Proveedores', ['price-lists.suppliers']),
    loader: await as('Cargas', ['price-lists.load']),
    uuid: seed.uuid,
    supplierOf: (id: string) => termsOf(kit.admin, id),
    supplier: async (name: string): Promise<string> =>
      (await kit.admin.request('/api/price-lists/suppliers', { name })).body.id,
    articles: (supplierId: string, articles: Article[]) => addArticles(seed, supplierId, articles),
    pendingList: (supplierId: string, rows: (Article & { previousCost?: bigint })[]) =>
      addPendingList(seed, supplierId, rows),
    products: (ids: string[]) => kit.server.catalog.read(db, ids),
  };
}

export type PriceListsKit = Awaited<ReturnType<typeof createPriceListsKit>>;
