// Las consultas de ver qué cambia (08 · R6.2 a R6.5; diseño de 08, § 1): el resumen es un `count …
// filter` y cada página del detalle, una consulta en el orden de «los que cambian primero».
import type { RowsShow, SkipReason } from '@ferrebress/shared/contracts/price-lists';
import type { CostBasis } from '@ferrebress/shared/pricing/basis';
import { sql } from 'kysely';
import type { Db } from './db.ts';

export type Counts = {
  new: number;
  changed: number;
  same: number;
  skipped: number;
  average: number | null;
  review: number;
  reasons: Partial<Record<SkipReason, number>>;
};

export type DetailRow = {
  code: string | null;
  description: string | null;
  brand: string | null;
  change: 'new' | 'changed' | 'same' | null;
  cost: string | null;
  previous: string | null;
  variation: number | null;
  basis: CostBasis | null;
  skipped: SkipReason | null;
  cells: string[] | null;
  // Dónde va en el orden: para la página siguiente.
  at: number;
  sheet: number;
  row: number;
};

// El orden del detalle: los que más cambian primero; después, en el orden de la planilla.
const position = sql`coalesce(abs_variation, -1)`;

const showFilter = (show: RowsShow | undefined, reviewPercent: number) => {
  switch (show) {
    case 'changed':
      return sql`change = 'changed'`;
    case 'new':
      return sql`change = 'new'`;
    case 'same':
      return sql`change = 'same'`;
    case 'review':
      return sql`change = 'changed' and abs_variation * 100 > ${reviewPercent}`;
    case 'skipped':
      return sql`skipped is not null`;
    default:
      return sql`list_price is not null`;
  }
};

// El resumen.
const totals = (db: Db) => ({
  async counts(listId: string, reviewPercent: number): Promise<Counts> {
    const totals = await sql<{
      new: number;
      changed: number;
      same: number;
      skipped: number;
      average: number | null;
      review: number;
    }>`
      select count(*) filter (where change = 'new')::int as new,
        count(*) filter (where change = 'changed')::int as changed,
        count(*) filter (where change = 'same')::int as same,
        count(*) filter (where skipped is not null)::int as skipped,
        avg((cost - previous_cost)::float8 / previous_cost) filter (where change = 'changed') as average,
        count(*) filter (where change = 'changed' and abs_variation * 100 > ${reviewPercent})::int as review
      from price_lists.list_rows where list_id = ${listId}`.execute(db);
    const reasons = await sql<{ skipped: SkipReason; count: number }>`
      select skipped, count(*)::int as count from price_lists.list_rows
      where list_id = ${listId} and skipped is not null group by skipped`.execute(db);
    return {
      ...(totals.rows[0] as Omit<Counts, 'reasons'>),
      reasons: Object.fromEntries(reasons.rows.map((one) => [one.skipped, one.count])),
    };
  },

  // Los que el proveedor tiene y la lista no trae (R7.4), y cuántos tiene.
  async gone(listId: string, supplierId: string): Promise<{ gone: number; active: number }> {
    const found = await sql<{ gone: number; active: number }>`
      select count(*) filter (where not exists (select 1 from price_lists.list_rows r
          where r.list_id = ${listId} and r.supplier_code = i.supplier_code))::int as gone,
        count(*)::int as active
      from price_lists.items i where i.supplier_id = ${supplierId} and not i.discontinued`.execute(
      db,
    );
    return found.rows[0] as { gone: number; active: number };
  },
});

// El detalle.
const detail = (db: Db) => ({
  // Una página del detalle, desde la posición `after`.
  async page(
    listId: string,
    query: {
      show?: RowsShow | undefined;
      key?: string | undefined;
      after?: [number, number, number] | undefined;
    },
    reviewPercent: number,
    size: number,
  ): Promise<DetailRow[]> {
    const after = query.after;
    const rows = await sql<DetailRow>`
      select supplier_code as code, description, brand, change, cost::text as cost,
        previous_cost::text as previous,
        case when change = 'changed' then round(((cost - previous_cost)::numeric * 100 / previous_cost), 1)::float8 end as variation,
        basis, skipped, cells, ${position}::float8 as at, sheet, row
      from price_lists.list_rows
      where list_id = ${listId} and ${showFilter(query.show, reviewPercent)}
        ${query.key ? sql`and search_key like ${`%${query.key}%`}` : sql``}
        ${after ? sql`and (${position} < ${after[0]} or (${position} = ${after[0]} and (sheet, row) > (${after[1]}, ${after[2]})))` : sql``}
      order by ${position} desc, sheet, row
      limit ${size + 1}`.execute(db);
    return rows.rows;
  },

  // Los que ya no vienen, por código.
  goneRows: async (
    listId: string,
    supplierId: string,
    key: string | undefined,
    after: string | undefined,
    size: number,
  ) =>
    (
      await sql<{
        code: string;
        description: string;
        brand: string | null;
        cost: string;
        basis: CostBasis;
      }>`
        select i.supplier_code as code, i.description, i.brand, i.cost::text as cost, i.basis
        from price_lists.items i
        where i.supplier_id = ${supplierId} and not i.discontinued
          and not exists (select 1 from price_lists.list_rows r
            where r.list_id = ${listId} and r.supplier_code = i.supplier_code)
          ${key ? sql`and i.search_key like ${`%${key}%`}` : sql``}
          ${after !== undefined ? sql`and i.supplier_code > ${after}` : sql``}
        order by i.supplier_code limit ${size + 1}`.execute(db)
    ).rows,
});

export const reviewData = (db: Db) => ({ ...totals(db), ...detail(db) });
