// La lectura de las listas (diseño de 08, § 1 y § 8): manda cada lista a los procesos lectores y
// guarda lo que cuentan, de a un mensaje por vez y cada uno en su transacción. Avisa el avance por el
// tema de la lista. Una lista cancelada, reemplazada o en la cola deja de leerse.
import { readFileSync } from 'node:fs';
import { businessDateOf } from '@ferrebress/shared/time/business';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { readersData } from '../data/readers.ts';
import { type ListRecord, readingData } from '../data/reading.ts';
import { rowsData } from '../data/rows.ts';
import { suppliersData } from '../data/suppliers.ts';
import { priceListsSettings } from '../settings.ts';
import type { Job, JobMessage } from './messages.ts';
import type { ReadingPool } from './pool.ts';
import { type Later, runStep } from './steps.ts';

export const autoCode = readFileSync(new URL('../readers/auto-1.js', import.meta.url), 'utf8');

export type ReadingDependencies = {
  pool: () => ReadingPool;
  // Avisa el avance de una lista a quien la mira.
  publish: (listId: string) => Promise<void>;
};

// El trabajo para el proceso lector: los lectores de ahora (R5.9), los proveedores para deducir por
// el nombre y los ajustes de ahora (06 · R8.4).
async function jobOf(ctx: PriceListsContext, list: ListRecord): Promise<Job> {
  const db = asDb(ctx.platform.db);
  const fixed = list.supplierFrom === 'screen' || list.supplierFrom === 'chosen';
  return {
    ...{ listId: list.id, attempt: list.attempts, fileName: list.fileName },
    path: ctx.platform.files.pathOf(list.fileSha as string) as string,
    supplierId: fixed ? list.supplierId : null,
    readers: (await readersData(db).usable()).map((reader) => ({
      ...{ id: reader.id, supplierId: reader.supplierId, params: reader.params },
      code: reader.origin === 'auto' ? autoCode : (reader.code as string),
    })),
    suppliers: await suppliersData(db).nameKeys(),
    today: businessDateOf(ctx.platform.clock.now()),
    confirmRows: list.sizeConfirmed ? null : ctx.settings().confirmRows,
    ...{ autoCode, limits: priceListsSettings.reader },
  };
}

// Un paso, en su transacción, si la lista sigue leyéndose en ese intento.
async function stepped(
  ctx: PriceListsContext,
  list: { id: string; attempt: number },
  message: JobMessage,
): Promise<Later> {
  const later: Later = { stop: [], restart: [], after: [] };
  await ctx.platform.db.transaction().execute(async (trx) => {
    const now = await readingData(asDb(trx)).reading(list.id, list.attempt);
    await runStep(ctx, trx, now, message, later);
  });
  return later;
}

// Un intento más, sin las filas ni el lector nuevo de antes; `undefined` si ya no se lee.
async function fresh(ctx: PriceListsContext, listId: string): Promise<ListRecord | undefined> {
  const db = asDb(ctx.platform.db);
  await rowsData(db).clear(listId);
  await readersData(db).dropPending(listId);
  return readingData(db).start(listId);
}

// Los mensajes del proceso, de a uno y en orden. Si uno falla, se corta el proceso y la lista queda
// dañada; lo que llega después ya no la encuentra leyéndose en ese intento.
function inOrder(run: (message: JobMessage) => Promise<void>, cut: () => void) {
  let chain = Promise.resolve();
  return {
    push(message: JobMessage) {
      chain = chain
        .then(() => run(message))
        .catch((error) => {
          console.error(error);
          cut();
          return run({ type: 'failed', reason: 'damaged' }).catch(console.error);
        });
    },
    done: () => chain,
  };
}

export function createReading(ctx: PriceListsContext, deps: ReadingDependencies) {
  const running = new Map<string, { cancel(): void; done: Promise<void> }>();

  // Lo que cuenta el proceso, en orden y cada uno en su transacción.
  const handle = async (list: { id: string; attempt: number }, message: JobMessage) => {
    const later = await stepped(ctx, list, message);
    for (const then of later.after) then();
    for (const id of later.stop) stop(id);
    for (const id of later.restart) await start(id);
    await deps.publish(list.id);
  };

  // Empieza a leerla de cero: un intento más, sin las filas ni el lector nuevo de antes. Un paso que no
  // se pudo guardar corta la lectura: la lista no se pudo leer, nunca queda a medias.
  const start = async (listId: string): Promise<void> => {
    stop(listId);
    const list = await fresh(ctx, listId);
    if (!list) return;
    const at = { id: listId, attempt: list.attempts };
    const steps = inOrder(
      (message) => handle(at, message),
      () => stop(listId),
    );
    const task = deps.pool().read(await jobOf(ctx, list), steps.push);
    const done = task.finished.then(() => steps.done());
    running.set(listId, { cancel: task.cancel, done });
    void done.then(() => {
      if (running.get(listId)?.done === done) running.delete(listId);
    });
    await deps.publish(listId);
  };

  // Deja de leerla: lo que todavía cuente el proceso ya no se guarda (otro intento o otro estado).
  const stop = (listId: string) => {
    running.get(listId)?.cancel();
    running.delete(listId);
  };

  return {
    start,
    stop,
    // Espera que terminen las lecturas en curso: para las pruebas y para cerrar.
    async idle(): Promise<void> {
      while (running.size > 0) await Promise.all([...running.values()].map((one) => one.done));
    },
  };
}

export type Reading = ReturnType<typeof createReading>;
