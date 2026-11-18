// Aplicar una lista dentro de su transacción (08 · R6.6, R7; diseño de 08, § 1): con el proveedor
// trabado, de a tandas de 1.000 filas; entre tanda y tanda mira si se canceló, y si sí, lanza: la
// transacción se deshace entera (R4.11, E86). Lo que va a Quién hizo qué se junta y se escribe al
// confirmar.
import type { ListResult, ListScope } from '@ferrebress/shared/contracts/price-lists';
import type { Transaction } from 'kysely';
import type { AfterCommit } from '../../../platform/events.ts';
import { newId } from '../../../platform/ids.ts';
import type { PriceListsContext } from '../context.ts';
import { applyData } from '../data/apply.ts';
import { asDb, jsonOf } from '../data/db.ts';
import { readersData } from '../data/readers.ts';
import { type ListRecord, readingData } from '../data/reading.ts';
import { type SupplierRecord, suppliersData } from '../data/suppliers.ts';
import { batchOf, type CostChange } from '../rules/apply.ts';
import { priceListsSettings } from '../settings.ts';
import { closeSkipped, openSkipped } from './anomalies.ts';

export class Cancelled extends Error {}

export type Applied = {
  list: ListRecord;
  supplier: SupplierRecord;
  result: ListResult;
  changes: CostChange[];
  // El archivo de la aplicada anterior, que ya no se guarda (R4.4, E88).
  oldFile: string | null;
  after: AfterCommit[];
};

type Watch = { cancelled: () => boolean; progress: (applied: number) => void };

export async function applyIn(
  ctx: PriceListsContext,
  trx: Transaction<unknown>,
  listId: string,
  userId: string,
  watch: Watch,
): Promise<Applied> {
  const db = asDb(trx);
  const list = (await readingData(db).one(listId, true)) as ListRecord;
  const supplierId = list.supplierId as string;
  const supplier = (await suppliersData(db).one(supplierId, true)) as SupplierRecord;
  const result: ListResult = { created: 0, changed: 0, gone: 0, restored: 0 };
  const changes = await applyRows(ctx, trx, list, supplier, watch, result);
  changes.push(...(await goneOf(ctx, trx, list.scope, supplierId, listId, result)));
  const oldFile = await closeOut(trx, list, supplier, userId, result, ctx.platform.clock.now());
  const after = [
    ctx.catalog.committed(trx),
    ...(await closeSkipped(ctx, trx, supplier.lastListId)),
    ...(await openSkipped(ctx, trx, list, supplier)),
  ];
  return { list, supplier, result, changes, oldFile, after };
}

// Las filas, de a tandas.
async function applyRows(
  ctx: PriceListsContext,
  trx: Transaction<unknown>,
  list: ListRecord,
  supplier: SupplierRecord,
  watch: Watch,
  result: ListResult,
): Promise<CostChange[]> {
  const data = applyData(asDb(trx));
  const changes: CostChange[] = [];
  let after: [number, number] = [-1, -1];
  let applied = 0;
  for (;;) {
    // Entre tanda y tanda cede el turno: así llega un «Cancelar» y se atienden otros pedidos.
    await new Promise((resolve) => setImmediate(resolve));
    if (watch.cancelled()) throw new Cancelled();
    const rows = await data.rows(list.id, after, priceListsSettings.batch);
    if (rows.length === 0) return changes;
    const known = new Map(
      (
        await data.known(
          supplier.id,
          rows.map((row) => row.code),
        )
      ).map((one) => [one.code, one]),
    );
    const batch = batchOf(rows, known, supplier.terms.defaultVat, () => newId(ctx.platform.clock));
    await ctx.catalog.create(
      trx,
      batch.created.map((one) => ({ ...one, supplierId: supplier.id })),
    );
    await data.write(supplier.id, list.id, batch.items);
    await ctx.catalog.update(trx, batch.updated);
    await ctx.catalog.setCosts(
      trx,
      batch.costs.map((one) => ({ ...one, supplierId: supplier.id })),
    );
    await ctx.catalog.restore(trx, batch.restored);
    result.created += batch.created.length;
    result.changed += batch.changes.length - batch.created.length;
    result.restored += batch.restored.length;
    changes.push(...batch.changes);
    applied += rows.length;
    watch.progress(applied);
    const last = rows.at(-1) as (typeof rows)[number];
    after = [last.sheet, last.row];
  }
}

// En una lista completa, los que no vinieron pierden su costo; los que nadie más trae quedan dados de
// baja (R7.4). Una de solo cambios no da de baja nada.
async function goneOf(
  ctx: PriceListsContext,
  trx: Transaction<unknown>,
  scope: ListScope,
  supplierId: string,
  listId: string,
  result: ListResult,
): Promise<CostChange[]> {
  if (scope !== 'full') return [];
  const data = applyData(asDb(trx));
  const gone = await data.gone(supplierId, listId);
  const ids = gone.map((one) => one.productId);
  await ctx.catalog.setCosts(
    trx,
    ids.map((id) => ({ id, cost: null, supplierId: null })),
  );
  await ctx.catalog.discontinue(trx, await data.alone(supplierId, ids));
  result.gone = gone.length;
  return gone.map((one) => ({ productId: one.productId, before: one.cost, after: null }));
}

// La lista aplicada, la última del proveedor, su lector activo y el archivo de la anterior fuera.
async function closeOut(
  trx: Transaction<unknown>,
  list: ListRecord,
  supplier: SupplierRecord,
  userId: string,
  result: ListResult,
  at: Date,
): Promise<string | null> {
  const db = asDb(trx);
  const lists = readingData(db);
  await suppliersData(db).setLastList(supplier.id, list.id, list.listDate);
  // Toda lista leída tiene su lector.
  await readersData(db).applied(list.readerId as string, list.id, supplier.id);
  await lists.set(list.id, {
    ...{ status: 'applied', reason: null, decided_by: userId, decided_at: at },
    result: jsonOf(result),
  });
  if (!supplier.lastListId) return null;
  const previous = (await lists.one(supplier.lastListId)) as ListRecord;
  if (previous.fileSha === null || previous.fileSha === list.fileSha) return null;
  await lists.set(previous.id, { file_sha256: null });
  return previous.fileSha;
}
