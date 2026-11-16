// Una lista como la ve la pantalla, con el nombre de su proveedor.
import type { ListState } from '@ferrebress/shared/contracts/price-lists';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { readingData } from '../data/reading.ts';
import { suppliersData } from '../data/suppliers.ts';
import { stateOf } from '../rules/lists.ts';

export async function listState(
  ctx: PriceListsContext,
  listId: string,
): Promise<ListState | undefined> {
  const db = asDb(ctx.platform.db);
  const list = await readingData(db).one(listId);
  if (!list) return undefined;
  const supplier = list.supplierId ? await suppliersData(db).one(list.supplierId) : undefined;
  return stateOf(list, supplier?.name);
}
