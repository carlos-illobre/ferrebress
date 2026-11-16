// Las listas de un proveedor (08 · R6.7) y sus productos (R8.1, R8.2): de a páginas, cada una en una
// consulta con índice.
import type { ListReason, ListResult, ListStatus } from '@ferrebress/shared/contracts/price-lists';
import type { CostBasis } from '@ferrebress/shared/pricing/basis';
import { sql } from 'kysely';
import type { Db } from './db.ts';

export type ListLine = {
  id: string;
  status: ListStatus;
  fileName: string;
  listDate: string | null;
  uploadedAt: Date;
  uploadedBy: string;
  decidedBy: string | null;
  decidedAt: Date | null;
  reason: ListReason | null;
  result: ListResult | null;
  file: boolean;
};

export type ItemLine = {
  code: string;
  description: string;
  brand: string | null;
  cost: string;
  basis: CostBasis;
  discontinued: boolean;
  goneListId: string | null;
  goneListDate: string | null;
  key: string;
};

export const historyData = (db: Db) => ({
  // De la más nueva a la más vieja, después de la lista `after`.
  lists: async (
    supplierId: string,
    after: string | undefined,
    limit: number,
  ): Promise<ListLine[]> =>
    (
      await sql<ListLine>`
        select id, status, file_name as "fileName", list_date::text as "listDate",
          uploaded_at as "uploadedAt", uploaded_by as "uploadedBy", decided_by as "decidedBy",
          decided_at as "decidedAt", reason, result, file_sha256 is not null as file
        from price_lists.lists l
        where supplier_id = ${supplierId}
          ${after ? sql`and (uploaded_at, id) < (select uploaded_at, id from price_lists.lists where id = ${after})` : sql``}
        order by uploaded_at desc, id desc limit ${limit + 1}`.execute(db)
    ).rows,

  // En orden alfabético, los que vienen o los dados de baja; con lo buscado, los que coinciden.
  items: async (
    supplierId: string,
    query: {
      discontinued: boolean;
      key?: string | undefined;
      after?: [string, string] | undefined;
    },
    limit: number,
  ): Promise<ItemLine[]> =>
    (
      await sql<ItemLine>`
        select i.supplier_code as code, i.description, i.brand, i.cost::text as cost, i.basis,
          i.discontinued, i.discontinued_list_id as "goneListId",
          l.list_date::text as "goneListDate", i.search_key as key
        from price_lists.items i
        left join price_lists.lists l on l.id = i.discontinued_list_id
        where i.supplier_id = ${supplierId} and i.discontinued = ${query.discontinued}
          ${query.key ? sql`and i.search_key like ${`%${query.key}%`}` : sql``}
          ${query.after ? sql`and (i.search_key, i.supplier_code) > (${query.after[0]}, ${query.after[1]})` : sql``}
        order by i.search_key, i.supplier_code limit ${limit + 1}`.execute(db)
    ).rows,
});
