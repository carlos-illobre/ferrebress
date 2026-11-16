// De quién es una lista (08 · R4.3; diseño de 08, § 3): confirmar el deducido, elegir otro o dar de
// alta uno nuevo, con «Cargar listas» (R2.2, E31b). Si cambia el que se había deducido, se vuelve a
// leer como del elegido (E29c, E29d); si no se había deducido ninguno, sigue sin volver a empezar (E31).
import {
  type ListState,
  type ListSupplierBody,
  listSupplierBody,
} from '@ferrebress/shared/contracts/price-lists';
import type { Context, MiddlewareHandler } from 'hono';
import type { Transaction } from 'kysely';
import { bySchema, readBody } from '../../../platform/guards.ts';
import { fail } from '../../../platform/http.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { type ListRecord, readingData } from '../data/reading.ts';
import { suppliersData } from '../data/suppliers.ts';
import { assign } from '../reading/assign.ts';
import { priceAll } from '../reading/pricing.ts';
import type { Reading } from '../reading/service.ts';
import { listState } from './state.ts';
import { addSupplier } from './suppliers.ts';

type Steps = { load: MiddlewareHandler; id: MiddlewareHandler; limited: MiddlewareHandler };
type Outcome = 'gone' | { stop: string[]; restart: boolean };

export function registerListSupplierRoute(ctx: PriceListsContext, reading: Reading, steps: Steps) {
  const body = readBody(bySchema(listSupplierBody));
  const { http, sessions } = ctx.platform;
  http.post(
    '/api/price-lists/lists/:id/supplier',
    sessions.require,
    steps.load,
    steps.id,
    steps.limited,
    body.step,
    (c) => choose(ctx, c, reading, body.of(c)),
  );
}

async function choose(
  ctx: PriceListsContext,
  c: Context,
  reading: Reading,
  chosen: ListSupplierBody,
) {
  const listId = c.req.param('id') as string;
  const outcome = await ctx.platform.db
    .transaction()
    .execute(async (trx): Promise<Outcome | Response> => {
      const list = await readingData(asDb(trx)).one(listId, true);
      if (!list) return fail(c, 404, 'not-found');
      if (list.status !== 'reading' && list.status !== 'pending')
        return fail(c, 409, 'list-closed');
      if (!('newSupplier' in chosen)) return fix(ctx, trx, list, chosen.supplierId);
      const added = await addSupplier(ctx, c, suppliersData(asDb(trx)), chosen.newSupplier);
      return added instanceof Response ? added : fix(ctx, trx, list, added.id);
    });
  if (outcome instanceof Response) return outcome;
  if (outcome === 'gone') return fail(c, 404, 'not-found');
  for (const other of outcome.stop) reading.stop(other);
  if (outcome.restart) await reading.start(listId);
  return c.json<ListState>((await listState(ctx, listId)) as ListState);
}

// Con la lista trabada y todavía leyéndose o en espera.
async function fix(
  ctx: PriceListsContext,
  trx: Transaction<unknown>,
  list: ListRecord,
  supplierId: string,
): Promise<Outcome> {
  const data = readingData(asDb(trx));
  const listId = list.id;
  const now = ctx.platform.clock.now();
  if (list.supplierId === supplierId) return confirm(trx, list);
  const deduced = list.supplierId !== null;
  const assigned = await assign(
    trx,
    list,
    { id: supplierId, from: 'chosen', confirmed: true },
    now,
  );
  if (assigned.outcome === 'gone') return 'gone';
  if (assigned.outcome !== 'set') return { stop: assigned.stopped, restart: false };
  if (deduced) {
    await data.set(listId, { status: 'reading', waiting_for: null, attempts: 0 });
    return { stop: assigned.stopped, restart: true };
  }
  await priceAll(trx, { id: listId, supplierId, listDate: list.listDate });
  await data.set(listId, { waiting_for: null, ...(list.readAt && { status: 'pending' }) });
  return { stop: assigned.stopped, restart: false };
}

// «Sí, es de…» (R4.3): confirma el deducido; si ya se leyó entera, queda en espera.
async function confirm(trx: Transaction<unknown>, list: ListRecord): Promise<Outcome> {
  await readingData(asDb(trx)).set(list.id, {
    supplier_confirmed: true,
    waiting_for: null,
    ...(list.readAt && { status: 'pending' }),
  });
  return { stop: [], restart: false };
}
