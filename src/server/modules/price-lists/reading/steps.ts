// Lo que hace el servidor con cada cosa que cuenta el proceso lector (08 · R4, R5; diseño de 08, § 1),
// dentro de una transacción con la lista trabada: lo de un intento viejo ya no llega acá.
import type { Transaction } from 'kysely';
import type { AfterCommit } from '../../../platform/events.ts';
import { newId } from '../../../platform/ids.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { readersData } from '../data/readers.ts';
import { type ListRecord, readingData } from '../data/reading.ts';
import { rowsData } from '../data/rows.ts';
import { suppliersData } from '../data/suppliers.ts';
import { assign } from './assign.ts';
import type { JobMessage } from './messages.ts';
import { priceRows, toPrice } from './pricing.ts';

// Lo que queda para después de confirmar: cortar lecturas, volver a leer, poner al día anomalías.
export type Later = { stop: string[]; restart: string[]; after: AfterCommit[] };
type Step<T extends JobMessage['type']> = (
  ctx: PriceListsContext,
  trx: Transaction<unknown>,
  list: ListRecord,
  message: Extract<JobMessage, { type: T }>,
  later: Later,
) => Promise<void>;

const subjectOf = (listId: string) => `price-lists:list:${listId}`;

const opened: Step<'opened'> = async (_ctx, trx, list, { rows }) =>
  readingData(asDb(trx)).set(list.id, { rows_total: rows, waiting_for: null });

const size: Step<'size'> = async (_ctx, trx, list, { rows }) =>
  readingData(asDb(trx)).set(list.id, { rows_total: rows, waiting_for: 'size' });

// La fecha, el lector y, si no se sabía, de quién es (R4.3, R4.5, R5.7).
const chosen: Step<'chosen'> = async (ctx, trx, list, { reader, supplier, date }, later) => {
  const db = asDb(trx);
  const now = ctx.platform.clock.now();
  const readerId = 'id' in reader ? reader.id : newId(ctx.platform.clock);
  if ('template' in reader) await readersData(db).addPending(readerId, list.id, reader.params, now);
  await readingData(db).set(list.id, {
    ...{ list_date: date.date, date_from: date.ignored ? 'server-ignored' : date.from },
    ...{ reader_id: readerId, new_reader: 'template' in reader },
    ...(list.supplierId === null && {
      waiting_for: supplier?.from === 'reader' ? null : 'supplier',
    }),
  });
  if (list.supplierId !== null || !supplier) return;
  const assigned = await assign(
    trx,
    list,
    { ...supplier, confirmed: supplier.from === 'reader' },
    now,
  );
  later.stop.push(...assigned.stopped);
};

const block: Step<'block'> = async (_ctx, trx, list, { products, skipped, rowsRead }) => {
  await rowsData(asDb(trx)).insert(list.id, products, skipped);
  if (list.supplierId)
    await priceRows(trx, { ...list, supplierId: list.supplierId }, toPrice(products));
  await readingData(asDb(trx)).set(list.id, { rows_read: rowsRead });
};

// Leída entera: espera de quién es o queda en espera de aplicarse (R6.1). Si antes no se pudo leer,
// su anomalía se cierra, y también las de otras suyas que no se pudieron leer (R9.2).
const done: Step<'done'> = async (ctx, trx, list, _message, later) => {
  const known = list.supplierId !== null && list.supplierConfirmed;
  await readingData(asDb(trx)).set(list.id, {
    read_at: ctx.platform.clock.now(),
    ...(known && { status: 'pending', waiting_for: null }),
  });
  later.after.push(await ctx.anomalies.close(trx, subjectOf(list.id)));
  if (!list.supplierId) return;
  for (const other of await readingData(asDb(trx)).unreadableOf(list.supplierId))
    later.after.push(await ctx.anomalies.close(trx, subjectOf(other)));
};

// No se pudo leer (R4.6): sin filas, con su motivo y su anomalía. Un proceso que murió se reintenta
// una vez (diseño de 08, § 8).
const failed: Step<'failed'> = async (ctx, trx, list, { reason }, later) => {
  if (reason === 'crashed' && list.attempts < 2) {
    later.restart.push(list.id);
    return;
  }
  const db = asDb(trx);
  await rowsData(db).clear(list.id);
  await readersData(db).dropPending(list.id);
  await readingData(db).set(list.id, { status: 'unreadable', reason, waiting_for: null });
  const found = list.supplierId ? await suppliersData(db).one(list.supplierId) : undefined;
  const supplier = found && { id: found.id, name: found.name };
  later.after.push(
    await ctx.anomalies.open(trx, {
      kind: 'price-list-unreadable',
      subject: subjectOf(list.id),
      summary: { file: list.fileName, reason, ...(supplier && { supplier }) },
    }),
  );
};

// Lo que cuenta el proceso, si la lista sigue leyéndose en ese intento; si no, nada.
export async function runStep(
  ctx: PriceListsContext,
  trx: Transaction<unknown>,
  list: ListRecord | undefined,
  message: JobMessage,
  later: Later,
): Promise<void> {
  if (!list) return;
  await (steps[message.type] as Step<JobMessage['type']>)(ctx, trx, list, message as never, later);
}

export const steps: { [T in JobMessage['type']]: Step<T> } = {
  opened,
  size,
  chosen,
  block,
  done,
  failed,
};
