// La anomalía de las filas salteadas (08 · R9.2): una por cada lista aplicada que salteó filas, con
// cuántas y por qué motivos, sin precios. Se cierra sola al aplicar la siguiente del proveedor.
import type { Transaction } from 'kysely';
import type { AfterCommit } from '../../../platform/events.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import type { ListRecord } from '../data/reading.ts';
import { reviewData } from '../data/review.ts';
import type { SupplierRecord } from '../data/suppliers.ts';

const subjectOf = (listId: string) => `price-lists:list:${listId}`;

export async function closeSkipped(
  ctx: PriceListsContext,
  trx: Transaction<unknown>,
  previous: string | null,
): Promise<AfterCommit[]> {
  if (!previous) return [];
  return [await ctx.anomalies.close(trx, subjectOf(previous), 'price-list-skipped-rows')];
}

export async function openSkipped(
  ctx: PriceListsContext,
  trx: Transaction<unknown>,
  list: ListRecord,
  supplier: SupplierRecord,
): Promise<AfterCommit[]> {
  const counts = await reviewData(asDb(trx)).counts(list.id, 0);
  if (counts.skipped === 0) return [];
  const summary = {
    supplier: { id: supplier.id, name: supplier.name },
    file: list.fileName,
    skipped: counts.skipped,
    reasons: counts.reasons,
  };
  return [
    await ctx.anomalies.open(trx, {
      kind: 'price-list-skipped-rows',
      subject: subjectOf(list.id),
      summary,
    }),
  ];
}
