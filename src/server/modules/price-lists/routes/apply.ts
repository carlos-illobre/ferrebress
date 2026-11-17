// Aplicar, descartar y cancelar una lista en espera (08 · R6.5 a R6.11; diseño de 08, § 3), con
// «Cargar listas». Aplicar manda los números que vio el botón y contesta enseguida: sigue por el tema.
import {
  type ApplyBody,
  applyBody,
  type ListNumbers,
  type ListState,
  type NumbersChanged,
  numbersOf,
} from '@ferrebress/shared/contracts/price-lists';
import type { Context, MiddlewareHandler } from 'hono';
import type { Transaction } from 'kysely';
import { bySchema, readBody } from '../../../platform/guards.ts';
import { fail } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { Applying } from '../apply/service.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { readingData } from '../data/reading.ts';
import { type SupplierRecord, suppliersData } from '../data/suppliers.ts';
import { discard } from '../reading/assign.ts';
import { sameNumbers } from '../rules/review.ts';
import { listState, summaryFor } from './state.ts';

type Steps = { load: MiddlewareHandler; id: MiddlewareHandler; limited: MiddlewareHandler };
type Refusal = 'not-found' | 'list-applied' | 'list-applying' | 'list-closed' | 'list-too-old';

export function registerApplyRoutes(ctx: PriceListsContext, applying: Applying, steps: Steps) {
  const { http, sessions } = ctx.platform;
  const body = readBody(bySchema(applyBody));
  const base = '/api/price-lists/lists/:id';
  http.post(
    `${base}/apply`,
    sessions.require,
    steps.load,
    steps.id,
    steps.limited,
    body.step,
    (c) => apply(ctx, c, applying, body.of(c)),
  );
  http.post(`${base}/discard`, sessions.require, steps.load, steps.id, steps.limited, (c) =>
    discardList(ctx, c),
  );
}

const refuse = (c: Context, refusal: Refusal) =>
  refusal === 'not-found' ? fail(c, 404, 'not-found') : fail(c, 409, refusal);

// R6.5, R6.9, R6.10: solo una en espera (ya tiene su proveedor confirmado), no más vieja que la última
// aplicada, y con los mismos números que vio quien aplica (E64).
async function apply(
  ctx: PriceListsContext,
  c: Context,
  applying: Applying,
  { expected }: ApplyBody,
) {
  const listId = c.req.param('id') as string;
  const { userId } = sessionOf(c);
  const outcome = await ctx.platform.db
    .transaction()
    .execute((trx) => readyToApply(ctx, trx, listId, expected));
  if (typeof outcome === 'string') return refuse(c, outcome);
  if (typeof outcome === 'object')
    return c.json<NumbersChanged>({ error: 'numbers-changed', numbers: outcome }, 409);
  applying.apply(listId, userId, (type, fields) => ctx.record(c, type, fields), outcome);
  return c.json<ListState>((await listState(ctx, listId)) as ListState, 202);
}

// Dentro de la transacción: los controles y, si pasa, «aplicándose». Devuelve cuántas filas tiene.
async function readyToApply(
  ctx: PriceListsContext,
  trx: Transaction<unknown>,
  listId: string,
  expected: ListNumbers,
): Promise<Refusal | ListNumbers | number> {
  const db = asDb(trx);
  const list = await readingData(db).one(listId, true);
  if (!list) return 'not-found';
  if (list.status !== 'pending') return refusalOf(list.status);
  const supplier = (await suppliersData(db).one(list.supplierId as string, true)) as SupplierRecord;
  const summary = await summaryFor(ctx, db, list, supplier);
  if (summary.tooOld) return 'list-too-old';
  const numbers = numbersOf(summary);
  if (!sameNumbers(numbers, expected)) return numbers;
  await readingData(db).set(listId, { status: 'applying', reason: null });
  // Una lista en espera ya se leyó entera.
  return list.rowsTotal as number;
}

const refusalOf = (status: string): Refusal =>
  status === 'applied' ? 'list-applied' : status === 'applying' ? 'list-applying' : 'list-closed';

// Descartar una en espera (R6.11): sin cambiar nada; su lector nuevo se va con ella (E45).
async function discardList(ctx: PriceListsContext, c: Context) {
  const listId = c.req.param('id') as string;
  const outcome = await ctx.platform.db.transaction().execute(async (trx) => {
    const list = await readingData(asDb(trx)).one(listId, true);
    if (!list) return 'not-found' as const;
    if (list.status !== 'pending') return 'list-closed' as const;
    await discard(trx, listId, 'by-hand', sessionOf(c).userId, ctx.platform.clock.now());
    return list;
  });
  if (typeof outcome === 'string') return refuse(c, outcome);
  ctx.record(c, 'lists.discarded', {
    targets: [{ kind: 'list', id: listId, name: outcome.fileName }],
    data: { reason: 'by-hand' },
  });
  return c.json<ListState>((await listState(ctx, listId)) as ListState);
}
