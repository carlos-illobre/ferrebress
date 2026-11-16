// Las rutas de una lista mientras se sube y se lee (08 · R4; diseño de 08, § 3): subirla con «Cargar
// listas», verla con «Ver costos», decir de quién es, confirmar una planilla grande, si es completa
// o de solo cambios, y cancelarla.
import {
  type ListScope,
  type ListState,
  scopeBody,
} from '@ferrebress/shared/contracts/price-lists';
import type { Context } from 'hono';
import { bySchema, readBody } from '../../../platform/guards.ts';
import { fail, uuidParams } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { readingData } from '../data/reading.ts';
import { discard } from '../reading/assign.ts';
import type { Reading } from '../reading/service.ts';
import { priceListsSettings } from '../settings.ts';
import { registerListSupplierRoute } from './list-supplier.ts';
import { listState } from './state.ts';
import { uploadList } from './upload-list.ts';

const base = '/api/price-lists/lists';

export function registerListRoutes(ctx: PriceListsContext, reading: Reading) {
  const { http, sessions, permissions } = ctx.platform;
  const load = permissions.require('price-lists.load');
  const id = uuidParams('id');
  const limited = ctx.limit(
    (c) => [`price-lists:lists:${sessionOf(c).id}`],
    priceListsSettings.changes,
  );
  const uploads = ctx.limit(
    (c) => [`price-lists:uploads:${sessionOf(c).userId}`],
    priceListsSettings.uploads,
  );
  const scope = readBody(bySchema(scopeBody));

  http.upload(base, sessions.require, load, uploads, (c) => uploadList(ctx, c, reading));

  http.get(
    `${base}/:id`,
    sessions.require,
    permissions.require('price-lists.costs'),
    id,
    async (c) => {
      const state = await listState(ctx, c.req.param('id'));
      return state ? c.json<ListState>(state) : fail(c, 404, 'not-found');
    },
  );

  http.post(`${base}/:id/size`, sessions.require, load, id, limited, (c) => size(ctx, c, reading));
  http.post(`${base}/:id/scope`, sessions.require, load, id, limited, scope.step, (c) =>
    changeScope(ctx, c, scope.of(c).scope),
  );
  http.post(`${base}/:id/cancel`, sessions.require, load, id, limited, (c) =>
    cancel(ctx, c, reading),
  );

  registerListSupplierRoute(ctx, reading, { load, id, limited });
}

// Cancelar mientras se lee (R4.11, E31e): queda descartada, con su archivo.
async function cancel(ctx: PriceListsContext, c: Context, reading: Reading) {
  const listId = c.req.param('id') as string;
  const outcome = await ctx.platform.db.transaction().execute(async (trx) => {
    const list = await readingData(asDb(trx)).one(listId, true);
    if (!list) return 'not-found' as const;
    if (list.status !== 'reading' && list.status !== 'queued') return 'closed' as const;
    await discard(trx, listId, 'cancelled', sessionOf(c).userId, ctx.platform.clock.now());
    return list;
  });
  if (outcome === 'not-found') return fail(c, 404, 'not-found');
  if (outcome === 'closed') return fail(c, 409, 'list-closed');
  reading.stop(listId);
  ctx.record(c, 'lists.discarded', {
    targets: [{ kind: 'list', id: listId, name: outcome.fileName }],
    data: { reason: 'cancelled' },
  });
  return c.json<ListState>((await listState(ctx, listId)) as ListState);
}

// Sigue leyendo una planilla grande (R4.12, E91).
async function size(ctx: PriceListsContext, c: Context, reading: Reading) {
  const data = readingData(asDb(ctx.platform.db));
  const list = await data.one(c.req.param('id') as string);
  if (!list) return fail(c, 404, 'not-found');
  if (list.status !== 'reading' || list.waitingFor !== 'size') return fail(c, 409, 'list-closed');
  await data.set(list.id, { size_confirmed: true, waiting_for: null, attempts: 0 });
  await reading.start(list.id);
  return c.json<ListState>((await listState(ctx, list.id)) as ListState);
}

// Completa o de solo cambios (R4.7), mientras no se aplicó.
async function changeScope(ctx: PriceListsContext, c: Context, scope: ListScope) {
  const data = readingData(asDb(ctx.platform.db));
  const list = await data.one(c.req.param('id') as string);
  if (!list) return fail(c, 404, 'not-found');
  if (!['queued', 'reading', 'pending'].includes(list.status)) return fail(c, 409, 'list-closed');
  await data.set(list.id, { scope });
  return c.json<ListState>((await listState(ctx, list.id)) as ListState);
}
