// Subir una lista (08 · R4.1, R4.2; diseño de 08, § 3): sin permiso o pasado el límite, ni se lee el
// cuerpo (E04); con otro formato o más grande que el máximo, no se guarda (E33, E34). La lista se crea
// leyéndose; si se sube desde la pantalla de un proveedor, ya es suya (E32).
import {
  type ListScope,
  type ListState,
  listExtensions,
  uploadQuery,
} from '@ferrebress/shared/contracts/price-lists';
import type { Context } from 'hono';
import { cleanFileName } from '../../../platform/download.ts';
import { fail } from '../../../platform/http.ts';
import { newId } from '../../../platform/ids.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { Stored } from '../../../platform/storage/files.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { type ListRecord, readingData } from '../data/reading.ts';
import { suppliersData } from '../data/suppliers.ts';
import { assign } from '../reading/assign.ts';
import type { Reading } from '../reading/service.ts';
import { extensionOf } from '../rules/format.ts';
import { priceListsSettings } from '../settings.ts';
import { listState } from './state.ts';
import { receive } from './upload.ts';

type Upload = { name: string; scope: ListScope; supplierId: string | undefined; maxMb: number };

// Lo que dice el pedido, antes de leer el cuerpo.
async function requested(ctx: PriceListsContext, c: Context): Promise<Upload | Response> {
  const query = uploadQuery.safeParse(c.req.query());
  if (!query.success) return fail(c, 400, 'bad-request');
  const name = cleanFileName(query.data.name).slice(0, 200);
  if (!extensionOf(name)) return fail(c, 415, 'file-format', { formats: listExtensions });
  const { supplierId } = query.data;
  if (
    supplierId &&
    (await suppliersData(asDb(ctx.platform.db)).one(supplierId))?.inactive !== false
  )
    return fail(c, 404, 'not-found');
  const maxMb = ctx.settings().maxFileMb;
  if (Number(c.req.header('Content-Length') ?? 0) > maxMb * 2 ** 20)
    return fail(c, 413, 'file-too-large', { maxMb });
  return { name, scope: query.data.scope ?? 'full', supplierId, maxMb };
}

// El cuerpo, al almacén.
async function stored(
  ctx: PriceListsContext,
  c: Context,
  upload: Upload,
): Promise<Stored | Response> {
  const received = await receive(c, ctx.platform.files, {
    ...{
      name: upload.name,
      maxBytes: upload.maxMb * 2 ** 20,
      idleMs: priceListsSettings.uploadIdleMs,
    },
    used: async (sha) => (await readingData(asDb(ctx.platform.db)).usesFile(sha)) > 0,
  });
  if (received === 'too-big') return fail(c, 413, 'file-too-large', { maxMb: upload.maxMb });
  if (received === 'format') return fail(c, 415, 'file-format', { formats: listExtensions });
  if (received === 'cut') return fail(c, 400, 'bad-request');
  return received;
}

export async function uploadList(ctx: PriceListsContext, c: Context, reading: Reading) {
  const upload = await requested(ctx, c);
  if (upload instanceof Response) return upload;
  const file = await stored(ctx, c, upload);
  if (file instanceof Response) return file;
  const listId = newId(ctx.platform.clock);
  const at = ctx.platform.clock.now();
  const stopped = await ctx.platform.db.transaction().execute(async (trx) => {
    const data = readingData(asDb(trx));
    await data.create({
      ...{ id: listId, fileSha: file.sha256, size: file.size, fileName: upload.name },
      ...{ scope: upload.scope, supplierId: null, by: sessionOf(c).userId, at },
    });
    if (!upload.supplierId) return [];
    const list = (await data.one(listId, true)) as ListRecord;
    const own = { id: upload.supplierId, from: 'screen' as const, confirmed: true };
    return (await assign(trx, list, own, at)).stopped;
  });
  for (const other of stopped.filter((one) => one !== listId)) reading.stop(other);
  if (!stopped.includes(listId)) await reading.start(listId);
  ctx.record(c, 'lists.uploaded', {
    targets: [{ kind: 'list', id: listId, name: upload.name }],
    data: {
      size: file.size,
      scope: upload.scope,
      ...(upload.supplierId && { supplierId: upload.supplierId }),
    },
  });
  return c.json<ListState>((await listState(ctx, listId)) as ListState, 201);
}
