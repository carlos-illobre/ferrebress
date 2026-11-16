// Fijar el proveedor de una lista (08 · R4.3, R4.8; diseño de 08, § 2): una sola regla, en una
// transacción, para las cuatro formas (desde su pantalla, por su lector, por el nombre y elegido). Una
// sola lista viva por proveedor: si tiene otra más vieja, esa se descarta como reemplazada; si la otra
// es más nueva, se descarta esta; si la otra se está aplicando, esta espera en la cola.
import type { SupplierFrom } from '@ferrebress/shared/contracts/price-lists';
import type { Transaction } from 'kysely';
import { asDb } from '../data/db.ts';
import { readersData } from '../data/readers.ts';
import { type ListRecord, readingData } from '../data/reading.ts';
import { rowsData } from '../data/rows.ts';
import { suppliersData } from '../data/suppliers.ts';

// Lo que hay que hacer al confirmar: cortar la lectura de las listas que dejaron de leerse.
export type Assigned = { outcome: 'set' | 'queued' | 'discarded' | 'gone'; stopped: string[] };

// Descarta una lista viva: sin sus filas ni su lector nuevo (R5.7).
export async function discard(
  trx: Transaction<unknown>,
  listId: string,
  reason: string,
  by: string | null,
  at: Date,
): Promise<void> {
  const db = asDb(trx);
  await readingData(db).set(listId, {
    ...{ status: 'discarded', reason, waiting_for: null },
    ...(by && { decided_by: by, decided_at: at }),
  });
  await rowsData(db).clear(listId);
  await readersData(db).dropPending(listId);
}

export async function assign(
  trx: Transaction<unknown>,
  list: ListRecord,
  supplier: { id: string; from: SupplierFrom; confirmed: boolean },
  at: Date,
): Promise<Assigned> {
  const db = asDb(trx);
  const found = await suppliersData(db).one(supplier.id, true);
  if (!found || found.inactive) return { outcome: 'gone', stopped: [] };
  const lists = readingData(db);
  const others = await lists.liveOf(supplier.id, list.id);
  const stopped: string[] = [];
  const older = (other: { id: string; uploadedAt: Date }) =>
    other.uploadedAt < list.uploadedAt ||
    (+other.uploadedAt === +list.uploadedAt && other.id < list.id);
  if (others.some((other) => other.status !== 'applying' && !older(other))) {
    await discard(trx, list.id, 'replaced', null, at);
    return { outcome: 'discarded', stopped: [list.id] };
  }
  for (const other of others.filter((one) => one.status !== 'applying')) {
    await discard(trx, other.id, 'replaced', null, at);
    stopped.push(other.id);
  }
  const queued = others.some((other) => other.status === 'applying');
  await lists.set(list.id, {
    ...{ supplier_id: supplier.id, supplier_from: supplier.from },
    ...{ supplier_confirmed: supplier.confirmed },
    ...(queued && { status: 'queued', waiting_for: null }),
  });
  if (queued) stopped.push(list.id);
  return { outcome: queued ? 'queued' : 'set', stopped };
}
