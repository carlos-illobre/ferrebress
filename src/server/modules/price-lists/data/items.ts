// Las consultas de los artículos de cada proveedor (diseño de 08, § 2), en lote.
import type { CostBasis } from '@ferrebress/shared/pricing/basis';
import { sql } from 'kysely';
import { bigText, type Db, jsonOf } from './db.ts';

export type ItemCost = { code: string; productId: string; cost: bigint; basis: CostBasis };

// Los costos de los que vienen.
const costs = (db: Db) => ({
  // Los que vienen (no dados de baja) de un proveedor, con su costo y su base.
  activeCosts: async (supplierId: string): Promise<ItemCost[]> =>
    (
      await db
        .selectFrom('price_lists.items')
        .select([
          'supplier_code as code',
          'product_id as productId',
          bigText('cost').as('cost'),
          'basis',
        ])
        .where('supplier_id', '=', supplierId)
        .where('discontinued', '=', false)
        .orderBy('supplier_code')
        .execute()
    ).map((row) => ({ ...row, cost: BigInt(row.cost), basis: row.basis as CostBasis })),

  // Una tanda, nunca vacía.
  async saveCosts(
    supplierId: string,
    costs: readonly Omit<ItemCost, 'productId'>[],
  ): Promise<void> {
    await sql`
      update price_lists.items i set cost = v.cost, basis = v.basis
      from jsonb_to_recordset(${jsonOf(costs)}) as v(code text, cost bigint, basis jsonb)
      where i.supplier_id = ${supplierId} and i.supplier_code = v.code`.execute(db);
  },
});

// Lo que pasa al dar de baja el proveedor.
const deactivation = (db: Db) => ({
  // Al dar de baja el proveedor (R2.4): cuántos pierden su costo y cuántos productos no tienen otro
  // proveedor que los traiga, y quedan dados de baja.
  async deactivation(supplierId: string): Promise<{ costs: number; discontinued: string[] }> {
    const costs = await db
      .selectFrom('price_lists.items')
      .select((eb) => eb.fn.countAll<string>().as('count'))
      .where('supplier_id', '=', supplierId)
      .where('discontinued', '=', false)
      .executeTakeFirstOrThrow();
    const alone = await sql<{ productId: string }>`
      select distinct i.product_id as "productId" from price_lists.items i
      where i.supplier_id = ${supplierId} and not i.discontinued
        and not exists (
          select 1 from price_lists.items o join price_lists.suppliers s on s.id = o.supplier_id
          where o.product_id = i.product_id and o.supplier_id <> i.supplier_id
            and not o.discontinued and not s.inactive)
      order by 1`.execute(db);
    return { costs: Number(costs.count), discontinued: alone.rows.map((row) => row.productId) };
  },

  // Todos dejan de venir, sin lista que lo diga: se dio de baja al proveedor.
  async discontinueAll(supplierId: string): Promise<void> {
    await db
      .updateTable('price_lists.items')
      .set({ discontinued: true, discontinued_list_id: null })
      .where('supplier_id', '=', supplierId)
      .where('discontinued', '=', false)
      .execute();
  },
});

export const itemsData = (db: Db) => ({ ...costs(db), ...deactivation(db) });
