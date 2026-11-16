// Más → Administración → Archivos de listas (06 · R10; diseño de 08, § 3) y bajar el archivo original
// de una lista (08 · R4.4, E40): los ve quien tiene «Ver costos»; los borra a mano, con «Deshacer», quien
// tiene «Cambiar los ajustes»; el de una lista que se lee, se aplica o espera su turno, no (E54).
import {
  type FilesPage,
  filesQuery,
  type ListFileView,
} from '@ferrebress/shared/contracts/price-lists';
import type { Context, MiddlewareHandler } from 'hono';
import { download } from '../../../platform/download.ts';
import { fail, uuidParams } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { type FileLine, filesData } from '../data/files.ts';
import { readingData } from '../data/reading.ts';
import { priceListsSettings } from '../settings.ts';

export const filesPageSize = 50;
// Bajar archivos, 2 a la vez por persona (diseño de 08, § 10).
const maxDownloads = 2;
const shaParam: MiddlewareHandler = async (c, next) =>
  /^[0-9a-f]{64}$/.test(c.req.param('sha') as string) ? next() : fail(c, 404, 'not-found');

const viewOf = (line: FileLine): ListFileView => ({
  sha256: line.sha,
  size: line.size,
  storedAt: line.storedAt.toISOString(),
  deleting: line.deleting,
  lists: line.lists.map((one) => ({
    ...{ id: one.id, fileName: one.fileName, status: one.status },
    ...(one.supplier && { supplier: one.supplier }),
  })),
});

export function registerFileRoutes(ctx: PriceListsContext) {
  const { http, sessions, permissions } = ctx.platform;
  const costs = permissions.require('price-lists.costs');
  const change = permissions.require('settings.change');
  const limited = ctx.limit(
    (c) => [`price-lists:files:${sessionOf(c).id}`],
    priceListsSettings.changes,
  );
  const base = '/api/price-lists/files';
  const downloading = new Map<string, number>();

  http.get(base, sessions.require, costs, (c) => page(ctx, c));
  http.post(`${base}/:sha/delete`, sessions.require, change, shaParam, limited, (c) =>
    remove(ctx, c),
  );
  http.post(`${base}/:sha/restore`, sessions.require, change, shaParam, limited, (c) =>
    restore(ctx, c),
  );
  http.get('/api/price-lists/lists/:id/file', sessions.require, costs, uuidParams('id'), (c) =>
    fileOf(ctx, c, downloading),
  );
}

async function page(ctx: PriceListsContext, c: Context) {
  const query = filesQuery.safeParse(c.req.query());
  if (!query.success) return fail(c, 400, 'bad-request');
  const after = query.data.after?.split('_');
  const data = filesData(asDb(ctx.platform.db));
  const lines = await data.page(after && [Number(after[0]), after[1] as string], filesPageSize);
  const shown = lines.slice(0, filesPageSize);
  const last = shown.at(-1);
  return c.json<FilesPage>({
    files: shown.map(viewOf),
    ...(lines.length > filesPageSize && last && { next: `${last.storedAt.getTime()}_${last.sha}` }),
    totalBytes: await data.total(),
    limitBytes: ctx.settings().filesMb * 2 ** 20,
  });
}

// Borrar a mano (R10.2, E53): queda marcado y se va del almacén pasado el «Deshacer».
async function remove(ctx: PriceListsContext, c: Context) {
  const sha = c.req.param('sha') as string;
  const marked = await filesData(asDb(ctx.platform.db)).mark(sha, ctx.platform.clock.now());
  if (marked === 'not-found') return fail(c, 404, 'not-found');
  if (marked === 'in-use') return fail(c, 409, 'file-in-use');
  ctx.record(c, 'files.deleted', { targets: [{ kind: 'file', id: sha }] });
  return c.json({ ok: true });
}

async function restore(ctx: PriceListsContext, c: Context) {
  const sha = c.req.param('sha') as string;
  if (!(await filesData(asDb(ctx.platform.db)).restore(sha))) return fail(c, 404, 'not-found');
  ctx.record(c, 'files.restored', { targets: [{ kind: 'file', id: sha }] });
  return c.json({ ok: true });
}

// El original, tal como se subió y con su nombre (E40); si ya no se guarda, 410.
async function fileOf(ctx: PriceListsContext, c: Context, downloading: Map<string, number>) {
  const list = await readingData(asDb(ctx.platform.db)).one(c.req.param('id') as string);
  if (!list) return fail(c, 404, 'not-found');
  if (list.fileSha === null || list.fileDeleting) return fail(c, 410, 'file-gone');
  const { userId } = sessionOf(c);
  const now = downloading.get(userId) ?? 0;
  if (now >= maxDownloads) return fail(c, 429, 'too-many-downloads');
  downloading.set(userId, now + 1);
  const chunks = ctx.platform.files.read(list.fileSha);
  async function* counted() {
    try {
      yield* chunks;
    } finally {
      downloading.set(userId, (downloading.get(userId) as number) - 1);
    }
  }
  return download(counted(), list.fileName);
}
