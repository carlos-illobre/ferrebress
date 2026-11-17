// Lo que se hace con una lista que se sube (08 · pantalla 2): empezar (rechazando antes lo que no se
// acepta, R4.2), cancelar (R4.11), cambiar si es completa (R4.7), leer igual una muy grande (R4.12) y
// decir de quién es (R4.3). Cada cosa que no se pudo hacer queda dicha en su lista.
import type {
  ListScope,
  ListState,
  ListSupplierBody,
} from '@ferrebress/shared/contracts/price-lists';
import type { ApiResult } from '../../../platform/server/api.ts';
import { listMaxMb } from '../../administration/index.ts';
import { listsApi } from '../api.ts';
import { refusalOf, type Upload } from './rules.ts';
import {
  abortOf,
  cutUpload,
  find,
  forget,
  listen,
  loadSuppliers,
  patch,
  stateArrived,
  uploads,
} from './store.ts';
import { uploadsTexts as texts } from './texts.ts';

let keys = 0;

type Refused = { ok: false; error: string; maxMb?: number };

function sendError(name: string, refused: Refused) {
  if (refused.error === 'file-too-large') return texts.tooBig(name, refused.maxMb as number);
  if (refused.error === 'file-format') return texts.notSheet(name);
  return texts.failed;
}

// Recién agregada al almacén: la lista existe.
async function send(key: string, file: File) {
  const upload = find(key) as Upload;
  const result = await listsApi.upload(
    file,
    {
      name: file.name,
      scope: upload.scope,
      ...(upload.supplierId && { supplierId: upload.supplierId }),
    },
    (sent) => patch(key, { sent }),
    abortOf(key).signal,
  );
  if (result === 'cancelled') return patch(key, { phase: 'cancelled' });
  if (!result.ok)
    return patch(key, { phase: 'failed', error: sendError(file.name, result as Refused) });
  stateArrived(key, result.data);
  const now = find(key);
  // Si mientras subía se cambió si es completa, se le dice ahora (R4.7).
  if (now && now.scope !== result.data.scope) void scopeOf(key, now.scope);
  listen(key, result.data.id);
  void loadSuppliers();
}

// Sube los archivos elegidos, cada uno con su avance (R4.10); de un proveedor, si se sube desde él.
export async function startUploads(files: readonly File[], supplierId?: string) {
  const maxMb = await listMaxMb();
  for (const file of files) {
    const key = `u${++keys}`;
    const error = refusalOf(file, maxMb);
    uploads.set([
      ...uploads.get(),
      {
        ...{ key, fileName: file.name, bytes: file.size, scope: 'full', sent: 0 },
        ...(supplierId && { supplierId }),
        phase: error ? 'failed' : 'sending',
        ...(error && { error }),
      },
    ]);
    if (!error) void send(key, file);
  }
}

// Un cambio a la lista en el servidor: lo que vuelve es su estado; si no, se dice.
async function change(
  key: string,
  request: Promise<ApiResult<ListState>>,
  failed = texts.saveFailed,
) {
  const result = await request;
  if (result.ok) return stateArrived(key, result.data);
  patch(key, { error: failed });
}

// Se cancela desde su tarjeta: la lista existe.
export function cancel(key: string) {
  const upload = find(key) as Upload;
  if (upload.phase === 'sending') return cutUpload(key);
  forget(key);
  patch(key, { phase: 'cancelled' });
  void change(key, listsApi.cancel(upload.listId as string));
}

export function close(key: string) {
  forget(key);
  uploads.set(uploads.get().filter((upload) => upload.key !== key));
}

export async function scopeOf(key: string, scope: ListScope) {
  patch(key, { scope, error: undefined });
  const listId = find(key)?.listId;
  if (listId) await change(key, listsApi.scope(listId, scope));
}

export const readAnyway = (key: string) => change(key, listsApi.size(find(key)?.listId as string));

const supplierErrors: Record<string, string> = {
  'supplier-exists': texts.exists,
  'supplier-inactive': texts.existsInactive,
  'invalid-field': texts.invalidName,
};

// De quién es (R4.3): uno que existe, o uno nuevo (R2.2).
export async function supplierOf(key: string, body: ListSupplierBody) {
  const result = await listsApi.supplier(find(key)?.listId as string, body);
  if (result.ok) {
    stateArrived(key, result.data);
    return patch(key, { choosing: false, error: undefined });
  }
  patch(key, { error: supplierErrors[result.error] ?? texts.saveFailed });
}

export const confirm = (key: string) =>
  supplierOf(key, { supplierId: find(key)?.state?.supplier?.id as string });
export const choose = (key: string) => patch(key, { choosing: true, error: undefined });
