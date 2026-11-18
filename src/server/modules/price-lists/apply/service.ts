// Aplicar listas (08 · R6.6, R6.9; diseño de 08, § 1 y § 10): de a una por vez en todo el servidor, en
// segundo plano, con el avance por el tema de la lista. Si falla o se cancela, no queda nada y la
// lista vuelve a esperar con el motivo. Al terminar, sigue la que esperaba en la cola (E85).
import type { ListProgress } from '@ferrebress/shared/contracts/price-lists';
import type { RecordFields } from '../../../platform/guards.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { readingData } from '../data/reading.ts';
import { discard } from '../reading/assign.ts';
import type { Reading } from '../reading/service.ts';
import { chunksOf } from '../rules/apply.ts';
import { supplierTarget } from '../rules/suppliers.ts';
import { priceListsSettings } from '../settings.ts';
import { type Applied, applyIn, Cancelled } from './apply-in.ts';

type Record = (type: string, fields: RecordFields) => void;

export type ApplyingDependencies = {
  reading: Reading;
  publish: (listId: string) => Promise<void>;
  // El avance mientras se aplica, sin consultar la base (la tiene la transacción).
  progress: (listId: string, progress: ListProgress) => void;
};

export function createApplying(ctx: PriceListsContext, deps: ApplyingDependencies) {
  let chain = Promise.resolve();
  const running = new Set<string>();
  const cancelled = new Set<string>();

  const run = async (listId: string, userId: string, record: Record, rows: number) => {
    const watch = {
      cancelled: () => cancelled.has(listId),
      progress: (applied: number) =>
        deps.progress(listId, { status: 'applying', rowsRead: rows, rowsTotal: rows, applied }),
    };
    const outcome = await ctx.platform.db
      .transaction()
      .execute((trx) => applyIn(ctx, trx, listId, userId, watch))
      .catch((error: unknown) => {
        if (!(error instanceof Cancelled)) console.error(error);
        return error instanceof Cancelled ? ('cancelled' as const) : ('apply-failed' as const);
      });
    running.delete(listId);
    cancelled.delete(listId);
    if (typeof outcome === 'string') await backToPending(ctx, listId, outcome);
    else await finished(ctx, outcome, record);
    await deps.publish(listId);
    await nextInQueue(ctx, deps.reading, listId);
  };

  return {
    // Empieza a aplicarla cuando le toque; la lista ya quedó «aplicándose».
    apply(listId: string, userId: string, record: Record, rows: number) {
      running.add(listId);
      chain = chain.then(() => run(listId, userId, record, rows));
    },
    // Cancela una que se aplica: se deshace todo (R4.11, E86). `false` si no se está aplicando.
    cancel(listId: string): boolean {
      if (!running.has(listId)) return false;
      cancelled.add(listId);
      return true;
    },
    idle: (): Promise<void> => chain,
  };
}

export type Applying = ReturnType<typeof createApplying>;

// Falló o se canceló: vuelve a esperar, con el motivo (R6.6).
async function backToPending(ctx: PriceListsContext, listId: string, reason: string) {
  await readingData(asDb(ctx.platform.db)).set(listId, {
    ...{ status: 'pending', reason, decided_by: null, decided_at: null },
  });
}

// Confirmada: lo que corre después, Quién hizo qué (la lista con sus números y los costos de cada
// producto, de a tandas) y el archivo de la anterior fuera del almacén.
async function finished(ctx: PriceListsContext, applied: Applied, record: Record) {
  for (const then of applied.after) then();
  const { list, supplier, result } = applied;
  record('lists.applied', {
    targets: [{ kind: 'list', id: list.id, name: list.fileName }, supplierTarget(supplier)],
    data: { ...result, ...(list.listDate && { listDate: list.listDate }) },
  });
  for (const chunk of chunksOf(applied.changes, priceListsSettings.auditChunk))
    record('lists.costs', {
      targets: chunk.map((one) => ({ kind: 'product', id: one.productId })),
      data: { listId: list.id, costs: chunk.map((one) => [one.before, one.after]) },
    });
  if (applied.oldFile && (await readingData(asDb(ctx.platform.db)).usesFile(applied.oldFile)) === 0)
    await ctx.platform.files.remove(applied.oldFile);
}

// La que esperaba en la cola detrás de esta sigue sola (E85); si esta no se aplicó, la reemplaza.
async function nextInQueue(ctx: PriceListsContext, reading: Reading, listId: string) {
  const list = await readingData(asDb(ctx.platform.db)).one(listId);
  const queued =
    list?.supplierId && (await readingData(asDb(ctx.platform.db)).queuedOf(list.supplierId));
  if (!queued) return;
  await ctx.platform.db.transaction().execute(async (trx) => {
    if (list.status === 'pending')
      await discard(trx, listId, 'replaced', null, ctx.platform.clock.now());
    await readingData(asDb(trx)).set(queued, { status: 'reading', attempts: 0 });
  });
  await reading.start(queued);
}
