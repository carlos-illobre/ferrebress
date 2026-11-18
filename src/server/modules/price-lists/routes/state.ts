// Una lista como la ve la pantalla, con el nombre de su proveedor; en espera, con su resumen (R6.2);
// aplicada, con lo que hizo (E60).
import type { ListState, ListSummary } from '@ferrebress/shared/contracts/price-lists';
import type { PriceListsContext } from '../context.ts';
import { asDb, type Db } from '../data/db.ts';
import { type ListRecord, readingData } from '../data/reading.ts';
import { reviewData } from '../data/review.ts';
import { type SupplierRecord, suppliersData } from '../data/suppliers.ts';
import { stateOf } from '../rules/lists.ts';
import { summaryOf } from '../rules/review.ts';

// El resumen de una lista leída de un proveedor sabido (1 consulta).
export async function summaryFor(
  ctx: PriceListsContext,
  db: Db,
  list: ListRecord,
  supplier: SupplierRecord,
): Promise<ListSummary> {
  const { reviewPercent, goneWarnPercent } = ctx.settings();
  const { counts, gone } = await reviewData(db).summary(list.id, supplier.id, reviewPercent);
  const tooOld =
    supplier.lastListDate !== null &&
    list.listDate !== null &&
    list.listDate < supplier.lastListDate;
  return summaryOf(counts, gone, { scope: list.scope, tooOld }, goneWarnPercent);
}

export async function listState(
  ctx: PriceListsContext,
  listId: string,
): Promise<ListState | undefined> {
  const db = asDb(ctx.platform.db);
  const list = await readingData(db).one(listId);
  if (!list) return undefined;
  const supplier = list.supplierId ? await suppliersData(db).one(list.supplierId) : undefined;
  const uploadedBy = await ctx.nameOf(list.uploadedBy);
  const state = { ...stateOf(list, supplier?.name), ...(uploadedBy && { uploadedBy }) };
  if (list.status === 'pending' && supplier)
    return { ...state, summary: await summaryFor(ctx, db, list, supplier) };
  // Lo que hizo al aplicarse; el tope que se pasaba (R7.7) ya va en `over`.
  return list.result && !('over' in list.result) ? { ...state, result: list.result } : state;
}
