// Las consultas de las listas (diseño de 08, § 2). Cada cambio de estado es una sola sentencia que
// mira el estado de antes, así dos pedidos a la vez no chocan (R6.9).
import type { CostBasis } from '@ferrebress/shared/pricing/basis';
import { sql } from 'kysely';
import { bigText, type Db, dateText, jsonOf } from './db.ts';

export const liveStatuses = ['queued', 'reading', 'pending'] as const;

export type LiveRow = {
  listId: string;
  listDate: string | null;
  sheet: number;
  row: number;
  listPrice: bigint;
  vat: number | null;
  brand: string | null;
  previousCost: bigint | null;
};

export type RowCost = {
  listId: string;
  sheet: number;
  row: number;
  cost: bigint;
  basis: CostBasis;
  change: 'new' | 'changed' | 'same';
};

// El estado de las listas de un proveedor.
const states = (db: Db) => ({
  applying: async (supplierId: string): Promise<boolean> =>
    (await db
      .selectFrom('price_lists.lists')
      .select('id')
      .where('supplier_id', '=', supplierId)
      .where('status', '=', 'applying')
      .executeTakeFirst()) !== undefined,

  // Las vivas de un proveedor, también la que espera en la cola (R2.4).
  liveIds: async (supplierId: string): Promise<string[]> =>
    (
      await db
        .selectFrom('price_lists.lists')
        .select('id')
        .where('supplier_id', '=', supplierId)
        .where('status', 'in', liveStatuses)
        .execute()
    ).map((row) => row.id),
});

// Los costos de las filas de su lista viva.
const rowCosts = (db: Db) => ({
  // Las filas leídas de su lista viva (leyéndose o en espera), que cambian con cómo cobra.
  liveRows: async (supplierId: string): Promise<LiveRow[]> =>
    (
      await db
        .selectFrom('price_lists.list_rows as r')
        .innerJoin('price_lists.lists as l', 'l.id', 'r.list_id')
        .select([
          'r.list_id as listId',
          dateText('l.list_date').as('listDate'),
          'r.sheet',
          'r.row',
          bigText('r.list_price').as('listPrice'),
          'r.vat',
          'r.brand',
          sql<string | null>`r.previous_cost::text`.as('previousCost'),
        ])
        .where('l.supplier_id', '=', supplierId)
        .where('l.status', 'in', ['reading', 'pending'])
        .where('r.list_price', 'is not', null)
        .orderBy('r.sheet')
        .orderBy('r.row')
        .execute()
    ).map((row) => ({
      ...row,
      listPrice: BigInt(row.listPrice),
      previousCost: row.previousCost === null ? null : BigInt(row.previousCost),
    })),

  // Una tanda, nunca vacía.
  async saveRowCosts(rows: readonly RowCost[]): Promise<void> {
    await sql`
      update price_lists.list_rows r
      set cost = v.cost, basis = v.basis, change = v.change
      from jsonb_to_recordset(${jsonOf(rows)}) as v(
        "listId" uuid, sheet smallint, row integer, cost bigint, basis jsonb, change text)
      where r.list_id = v."listId" and r.sheet = v.sheet and r.row = v.row`.execute(db);
  },
});

export const listsData = (db: Db) => ({ ...states(db), ...rowCosts(db) });
