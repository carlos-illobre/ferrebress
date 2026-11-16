// Lo que cambia costos de un proveedor (08 · R2.4 a R2.6, R3.5; diseño de 08, § 3): cómo cobra, darlo
// de baja y reactivarlo, con «Administrar proveedores». Lo que cambia costos se confirma antes con
// cuántos (no lleva «Deshacer») y es una sola transacción: si algo falla, no cambia nada (E25).
import {
  type ConfirmCosts,
  type ConfirmDeactivate,
  deactivateBody,
  type Terms,
  type TermsBody,
  type TermsChanged,
  type TermsResponse,
  termsBody,
} from '@ferrebress/shared/contracts/price-lists';
import type { Context, MiddlewareHandler } from 'hono';
import type { Transaction } from 'kysely';
import { bySchema, readBody } from '../../../platform/guards.ts';
import { fail } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { itemsData } from '../data/items.ts';
import { listsData } from '../data/lists.ts';
import { type SupplierRecord, suppliersData } from '../data/suppliers.ts';
import { discard } from '../reading/assign.ts';
import type { Reading } from '../reading/service.ts';
import { supplierTarget } from '../rules/suppliers.ts';
import { changesCosts, recalculatedItems, recalculatedRows } from '../rules/terms.ts';
import { priceListsSettings } from '../settings.ts';

type Steps = { manage: MiddlewareHandler; id: MiddlewareHandler; limited: MiddlewareHandler };

const chunks = <T>(list: readonly T[]): T[][] =>
  Array.from({ length: Math.ceil(list.length / priceListsSettings.batch) }, (_, i) =>
    list.slice(i * priceListsSettings.batch, (i + 1) * priceListsSettings.batch),
  );

const dataIn = (trx: Transaction<unknown>) => ({
  suppliers: suppliersData(asDb(trx)),
  items: itemsData(asDb(trx)),
  lists: listsData(asDb(trx)),
});

// El proveedor trabado hasta confirmar: una lista no empieza a aplicarse mientras tanto (R2.6).
type Locked =
  | { refused: 'not-found' | 'list-applying' }
  | { now: SupplierRecord; data: ReturnType<typeof dataIn> };

async function lockedSupplier(trx: Transaction<unknown>, supplierId: string): Promise<Locked> {
  const data = dataIn(trx);
  const now = await data.suppliers.one(supplierId, true);
  if (!now) return { refused: 'not-found' };
  if (await data.lists.applying(supplierId)) return { refused: 'list-applying' };
  return { now, data };
}

const refuse = (c: Context, refused: 'not-found' | 'list-applying') =>
  refused === 'not-found' ? fail(c, 404, 'not-found') : fail(c, 409, 'list-applying');

export function registerSupplierStateRoutes(
  ctx: PriceListsContext,
  reading: Reading,
  steps: Steps,
) {
  const { http, sessions } = ctx.platform;
  const { manage, id, limited } = steps;
  const terms = readBody(bySchema(termsBody));
  const deactivate = readBody(bySchema(deactivateBody));
  const base = '/api/price-lists/suppliers/:id';

  http.post(`${base}/terms`, sessions.require, manage, id, limited, terms.step, (c) =>
    changeTerms(ctx, c, terms.of(c)),
  );
  http.post(`${base}/deactivate`, sessions.require, manage, id, limited, deactivate.step, (c) =>
    deactivated(ctx, c, reading, deactivate.of(c).confirmed),
  );
  http.post(`${base}/reactivate`, sessions.require, manage, id, limited, async (c) => {
    const data = suppliersData(asDb(ctx.platform.db));
    const supplierId = c.req.param('id');
    if (!(await data.setInactive(supplierId, false)))
      return (await data.one(supplierId))
        ? fail(c, 409, 'not-inactive')
        : fail(c, 404, 'not-found');
    const now = await data.one(supplierId);
    ctx.record(c, 'suppliers.reactivated', {
      targets: [supplierTarget(now as { id: string; name: string })],
    });
    return c.json({ ok: true });
  });
}

type TermsOutcome =
  | { refused: 'not-found' | 'list-applying' }
  | { changed: { value: Terms; version: number } }
  | { confirm: number }
  | { saved: { before: Terms; name: string; costs: number } };

// Cómo cobra (R3.5): con «Recalcular», los artículos que vienen y sus productos; siempre, las filas
// de su lista viva, que es la próxima (E24). Si cambian costos, solo con el mismo número que vio quien
// confirma (E21).
async function changeTerms(ctx: PriceListsContext, c: Context, body: TermsBody) {
  const supplierId = c.req.param('id') as string;
  const outcome = await ctx.platform.db
    .transaction()
    .execute((trx) => termsIn(ctx, trx, supplierId, body))
    .catch((error: unknown) => {
      console.error(error);
      return undefined;
    });
  if (outcome === undefined) return fail(c, 503, 'recalc-failed');
  if ('refused' in outcome) return refuse(c, outcome.refused);
  if ('changed' in outcome)
    return c.json<TermsChanged>({ error: 'terms-changed', ...outcome.changed }, 409);
  if ('confirm' in outcome)
    return c.json<ConfirmCosts>({ error: 'confirm-costs', costs: outcome.confirm }, 409);
  const { before, name, costs } = outcome.saved;
  ctx.record(c, 'suppliers.terms-changed', {
    targets: [supplierTarget({ id: supplierId, name })],
    changes: { terms: { before, after: body.terms } },
    data: { costs },
  });
  return c.json<TermsResponse>({ value: body.terms, version: body.version + 1, costs });
}

// Dentro de la transacción: con el proveedor trabado, la versión que se vio y, si cambian costos,
// el mismo número que vio quien confirma.
async function termsIn(
  ctx: PriceListsContext,
  trx: Transaction<unknown>,
  supplierId: string,
  { terms, version, confirmed }: TermsBody,
): Promise<TermsOutcome> {
  const locked = await lockedSupplier(trx, supplierId);
  if ('refused' in locked) return locked;
  const { now, data } = locked;
  if (now.termsVersion !== version)
    return { changed: { value: now.terms, version: now.termsVersion } };
  const costing = changesCosts(now.terms, terms);
  const items =
    costing && terms.onChange === 'recalculate'
      ? await recalculateItems(ctx, trx, supplierId, terms, confirmed)
      : { costs: 0 };
  if ('confirm' in items) return items;
  if (costing || now.terms.defaultVat !== terms.defaultVat)
    for (const batch of chunks(recalculatedRows(await data.lists.liveRows(supplierId), terms)))
      await data.lists.saveRowCosts(batch);
  await data.suppliers.saveTerms(supplierId, terms, version);
  return { saved: { before: now.terms, name: now.name, costs: items.costs } };
}

// Los artículos que vienen y sus productos, con lo nuevo (E22), en tandas.
async function recalculateItems(
  ctx: PriceListsContext,
  trx: Transaction<unknown>,
  supplierId: string,
  terms: Terms,
  confirmed: number | undefined,
): Promise<{ confirm: number } | { costs: number }> {
  const items = itemsData(asDb(trx));
  const { updates, costs } = recalculatedItems(await items.activeCosts(supplierId), terms);
  if (costs > 0 && confirmed !== costs) return { confirm: costs };
  for (const batch of chunks(updates)) {
    await items.saveCosts(supplierId, batch);
    const products = batch.map(({ productId, cost }) => ({ id: productId, cost, supplierId }));
    await ctx.catalog.setCosts(trx, products);
  }
  return { costs };
}

// Sus productos sin su costo, los que no trae nadie más dados de baja, sus listas vivas descartadas y
// él fuera de la lista. Devuelve las listas que hay que dejar de leer.
async function withoutSupplier(
  ctx: PriceListsContext,
  trx: Transaction<unknown>,
  supplierId: string,
  discontinued: string[],
  userId: string,
): Promise<string[]> {
  const data = dataIn(trx);
  await ctx.catalog.dropSupplier(trx, supplierId);
  for (const batch of chunks(discontinued)) await ctx.catalog.discontinue(trx, batch);
  await data.items.discontinueAll(supplierId);
  const stopped = await data.lists.liveIds(supplierId);
  for (const listId of stopped)
    await discard(trx, listId, 'supplier-inactive', userId, ctx.platform.clock.now());
  await data.suppliers.setInactive(supplierId, true);
  return stopped;
}

type DeactivateOutcome =
  | { refused: 'not-found' | 'list-applying' }
  | { confirm: { costs: number; discontinued: number } }
  | { done: { name: string; costs: number; discontinued: number; stopped: string[] } };

// Dar de baja (R2.4): quita su costo de sus productos, da de baja los que no trae nadie más, descarta
// su lista viva y lo saca de la lista. Siempre se confirma con los dos números (E12).
async function deactivated(
  ctx: PriceListsContext,
  c: Context,
  reading: Reading,
  confirmed: { costs: number; discontinued: number } | undefined,
) {
  const supplierId = c.req.param('id') as string;
  const { userId } = sessionOf(c);
  const outcome = await ctx.platform.db
    .transaction()
    .execute(async (trx): Promise<DeactivateOutcome> => {
      const locked = await lockedSupplier(trx, supplierId);
      if ('refused' in locked) return locked;
      const { now, data } = locked;
      if (now.inactive) return { refused: 'not-found' };
      const { costs, discontinued } = await data.items.deactivation(supplierId);
      const counts = { costs, discontinued: discontinued.length };
      if (confirmed?.costs !== counts.costs || confirmed.discontinued !== counts.discontinued)
        return { confirm: counts };
      const stopped = await withoutSupplier(ctx, trx, supplierId, discontinued, userId);
      return { done: { name: now.name, ...counts, stopped } };
    });
  if ('refused' in outcome) return refuse(c, outcome.refused);
  if ('confirm' in outcome)
    return c.json<ConfirmDeactivate>({ error: 'confirm-deactivate', ...outcome.confirm }, 409);
  const { name, stopped, ...counts } = outcome.done;
  for (const listId of stopped) reading.stop(listId);
  ctx.record(c, 'suppliers.deactivated', {
    targets: [supplierTarget({ id: supplierId, name })],
    data: counts,
  });
  return c.json({ ok: true, ...counts });
}
