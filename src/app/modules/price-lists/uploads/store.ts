// Las listas que se suben (08 · R4.9, R4.10; diseño de 08, § 7): viven en un almacén del módulo, fuera
// de cualquier pantalla, así siguen mientras se trabaja en otra cosa. Cada una se sube con su avance y
// después se sigue por el tema `price-lists.list`, que el servidor manda mientras se lee. Lo que no se
// guarda en el almacén (cómo cortar la subida y dejar de escuchar el tema) queda al lado, por clave.
import type {
  ListProgress,
  ListState,
  ListStatus,
  SupplierRow,
} from '@ferrebress/shared/contracts/price-lists';
import { realtime } from '../../../platform/realtime/channel.ts';
import { createStore, useStore } from '../../../platform/store.ts';
import { listsApi, suppliersApi } from '../api.ts';
import type { Phase, Upload } from './rules.ts';

export const uploads = createStore<readonly Upload[]>([]);
// Los proveedores, para elegir de quién es una lista y saber si tenía otra en espera (R4.3, R4.8).
export const knownSuppliers = createStore<readonly SupplierRow[]>([]);

const running = new Map<string, { abort?: AbortController; stop?: () => void }>();

export const find = (key: string) => uploads.get().find((upload) => upload.key === key);

export function patch(key: string, change: Partial<Upload>) {
  uploads.set(
    uploads.get().map((upload) => (upload.key === key ? { ...upload, ...change } : upload)),
  );
}

const phases: Record<ListStatus, Phase> = {
  queued: 'reading',
  reading: 'reading',
  pending: 'done',
  applying: 'done',
  applied: 'done',
  unreadable: 'failed',
  discarded: 'cancelled',
};
export const phaseOf = (status: ListStatus): Phase => phases[status];
const over = (status: ListStatus) => phaseOf(status) !== 'reading';

export async function loadSuppliers() {
  const result = await suppliersApi.list();
  if (result.ok) knownSuppliers.set(result.data.suppliers);
}

// Deja de escuchar el tema y olvida cómo cortar la subida.
export function forget(key: string) {
  running.get(key)?.stop?.();
  running.delete(key);
}

export const abortOf = (key: string) => {
  const abort = new AbortController();
  running.set(key, { abort });
  return abort;
};
export const cutUpload = (key: string) => running.get(key)?.abort?.abort();

// Lo que vuelve el servidor de una lista: su estado, en qué va y de quién es.
export function stateArrived(key: string, state: ListState) {
  const { id, status, waitingFor, rowsRead, rowsTotal, reason } = state;
  const progress: ListProgress = {
    status,
    rowsRead,
    ...(waitingFor && { waitingFor }),
    ...(rowsTotal !== undefined && { rowsTotal }),
    ...(reason && { reason }),
  };
  patch(key, { listId: id, state, progress, phase: phaseOf(status) });
}

async function refresh(key: string) {
  const listId = find(key)?.listId as string;
  const result = await listsApi.one(listId);
  if (result.ok && find(key)) patch(key, { state: result.data });
}

// Cada aviso del tema: cuántas filas leyó y si espera algo. Cuando cambia el estado, lo que espera, o
// todavía no se sabe de quién es, se trae el estado entero (el aviso no trae el proveedor).
async function progressed(key: string, progress: ListProgress) {
  const before = find(key);
  if (!before) return;
  // Se escucha recién después de llegar su estado: ya tiene en qué va.
  const now = before.progress as ListProgress;
  const changed =
    now.status !== progress.status ||
    now.waitingFor !== progress.waitingFor ||
    !before.state?.supplier;
  patch(key, { progress, phase: phaseOf(progress.status) });
  if (over(progress.status)) forget(key);
  if (changed) await refresh(key);
}

export function listen(key: string, listId: string) {
  const stop = realtime.want(`price-lists.list:${listId}`, {
    onEvent: (data) => void progressed(key, data as ListProgress),
  });
  running.set(key, { ...running.get(key), stop });
}

// Si hay alguna lista en el panel: la vista baja el panel recién entonces.
export const useAnyUpload = () => useStore(uploads).length > 0;
