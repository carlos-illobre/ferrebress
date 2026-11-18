// Las consultas de ver qué cambia (08 · R6.2 a R6.5; diseño de 08, § 1): el resumen es un `count …
// filter` y cada página del detalle, una consulta en el orden de «los que cambian primero».
import type { RowsShow, SkipReason } from '@ferrebress/shared/contracts/price-lists';
import type { CostBasis } from '@ferrebress/shared/pricing/basis';
import { sql } from 'kysely';
import { containing, type Db } from './db.ts';

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

type Totals = Omit<Counts, 'reasons'> & { reasons: Counts['reasons'] | null };
type Gone = { gone: number; active: number };

// Cuántas de cada cosa, con los motivos de las salteadas.
const countsOf = (listId: string, reviewPercent: number) => sql`
  with rows as (select * from price_lists.list_rows where list_id = ${listId}),
  reasons as (select skipped, count(*)::int as count from rows
    where skipped is not null group by skipped)
  select count(*) filter (where change = 'new')::int as new,
    count(*) filter (where change = 'changed')::int as changed,
    count(*) filter (where change = 'same')::int as same,
    count(*) filter (where skipped is not null)::int as skipped,
    avg((cost - previous_cost)::float8 / previous_cost) filter (where change = 'changed') as average,
    count(*) filter (where change = 'changed' and abs_variation * 100 > ${reviewPercent})::int as review,
    (select jsonb_object_agg(skipped, count) from reasons) as reasons
  from rows`;

// Los que el proveedor tiene y la lista no trae (R7.4), y cuántos tiene.
const goneOf = (listId: string, supplierId: string) => sql`
  select count(*) filter (where not exists (select 1 from price_lists.list_rows r
      where r.list_id = ${listId} and r.supplier_code = i.supplier_code))::int as gone,
    count(*)::int as active
  from price_lists.items i where i.supplier_id = ${supplierId} and not i.discontinued`;

const withReasons = <T extends Totals>(found: T) => ({ ...found, reasons: found.reasons ?? {} });

// El resumen.
const totals = (db: Db) => ({
  async counts(listId: string, reviewPercent: number): Promise<Counts> {
    const found = await sql<Totals>`${countsOf(listId, reviewPercent)}`.execute(db);
    return withReasons(found.rows[0] as Totals);
  },

  // Las dos cosas a la vez, para el resumen de una lista en espera: una sola consulta.
  async summary(listId: string, supplierId: string, reviewPercent: number) {
    const found = await sql<Totals & Gone>`
      select * from (${countsOf(listId, reviewPercent)}) c, (${goneOf(listId, supplierId)}) g`.execute(
      db,
    );
    const { gone, active, ...counts } = withReasons(found.rows[0] as Totals & Gone);
    return { counts, gone: { gone, active } };
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
        ${query.key ? sql`and search_key like ${containing(query.key)}` : sql``}
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
          ${key ? sql`and i.search_key like ${containing(key)}` : sql``}
          ${after !== undefined ? sql`and i.supplier_code > ${after}` : sql``}
        order by i.supplier_code limit ${size + 1}`.execute(db)
    ).rows,
});

export const reviewData = (db: Db) => ({ ...totals(db), ...detail(db) });
