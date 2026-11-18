// Cambiar el margen, la unidad o el IVA de un producto (07 · R1.4, R1.5, R2.7, R4.2, R5.1; diseño de
// 07, § 3): en una transacción que lee el paso compartido, traba el producto, compara lo que vio quien
// cambia y guarda con el precio nuevo. Si una lista de su proveedor se está aplicando, espera su turno
// como mucho 5 s. Contesta el producto como quedó, o el de ahora si otro lo cambió antes.
import {
  type MarginBody,
  marginBody,
  type ProductChanged,
  type ProductRow,
  productId,
  unitBody,
  vatBody,
} from '@ferrebress/shared/contracts/catalog';
import type { PermissionId } from '@ferrebress/shared/contracts/permissions';
import type { Context } from 'hono';
import { type Kysely, sql, type Transaction } from 'kysely';
import { bySchema, readBody } from '../../../platform/guards.ts';
import { fail } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { CatalogTables } from '../data.ts';
import { changesData } from '../data-changes.ts';
import { pagesData, type StoredProduct } from '../data-pages.ts';
import { centsOf, pricingData } from '../data-pricing.ts';
import { type Change, pricedAfter, writeOf } from '../rules/changes.ts';
import { rowOf } from '../rules/views.ts';
import { catalogSettings } from '../settings.ts';
import { type CatalogContext, seesCosts } from './context.ts';

type Outcome =
  | { refused: 'not-found' | 'list-applying' }
  | { changed: StoredProduct }
  | { same: StoredProduct }
  | { done: { before: StoredProduct; after: StoredProduct } };

const lockTimeout = `${catalogSettings.waitListMs}ms`;

async function changeIn(trx: Transaction<unknown>, id: string, change: Change): Promise<Outcome> {
  const db = trx as unknown as Kysely<CatalogTables>;
  await sql`select set_config('lock_timeout', ${lockTimeout}, true)`.execute(db);
  const step = await pricingData(db).stepForShare();
  const stored = await pagesData(db).one(id, true);
  if (!stored) return { refused: 'not-found' };
  const write = writeOf(stored, change);
  if (write === 'changed') return { changed: stored };
  if (write === 'same') return { same: stored };
  const prices = centsOf(pricedAfter(stored, write), step);
  return { done: { before: stored, after: await changesData(db).write(id, write, prices) } };
}

// Una fila trabada más del tiempo que se espera la tiene una lista que se aplica: `list-applying`.
export const orListApplying = <T>(work: Promise<T>): Promise<T | { refused: 'list-applying' }> =>
  work.catch((error: unknown) => {
    if ((error as { code?: string }).code === '55P03') return { refused: 'list-applying' as const };
    throw error;
  });

const refusedStatus = { 'not-found': 404, 'list-applying': 409 } as const;

const audited = {
  margin: { type: 'products.margin-changed', of: (p: StoredProduct) => p.margin },
  unit: { type: 'products.unit-changed', of: (p: StoredProduct) => p.unit },
  vat: { type: 'products.vat-changed', of: (p: StoredProduct) => p.vat },
};

function record(
  ctx: CatalogContext,
  c: Context,
  field: Change['field'],
  done: { before: StoredProduct; after: StoredProduct },
) {
  const { before, after } = done;
  const { type, of } = audited[field];
  ctx.record(c, type, {
    targets: [{ kind: 'product', id: after.id, name: after.description }],
    changes: {
      [field]: { before: of(before), after: of(after) },
      ...(before.sale !== after.sale && { price: { before: before.sale, after: after.sale } }),
    },
  });
}

async function change(
  ctx: CatalogContext,
  c: Context,
  field: Change['field'],
  body: Change['body'],
) {
  const id = c.req.param('id') as string;
  if (!productId.safeParse(id).success) return fail(c, 404, 'not-found');
  const outcome = await orListApplying(
    ctx.platform.db.transaction().execute((trx) => changeIn(trx, id, { field, body } as Change)),
  );
  if ('refused' in outcome) return fail(c, refusedStatus[outcome.refused], outcome.refused);
  const sees = seesCosts(c);
  if ('changed' in outcome)
    return c.json<ProductChanged>(
      { error: 'product-changed', product: rowOf(outcome.changed, sees) },
      409,
    );
  if ('same' in outcome) return c.json<ProductRow>(rowOf(outcome.same, sees));
  record(ctx, c, field, outcome.done);
  const { after } = outcome.done;
  if (!after.discontinued) ctx.index.setPriced(after.id, after.sale !== null);
  return c.json<ProductRow>(rowOf(after, sees));
}

const fields: {
  field: Change['field'];
  permission: PermissionId;
  body: { safeParse: (raw: unknown) => { success: true; data: unknown } | { success: false } };
}[] = [
  { field: 'margin', permission: 'catalog.margins', body: marginBody },
  { field: 'unit', permission: 'catalog.products', body: unitBody },
  { field: 'vat', permission: 'catalog.products', body: vatBody },
];

export function registerChangeRoutes(ctx: CatalogContext): void {
  const { http, sessions, permissions } = ctx.platform;
  // Por persona, no por sesión: abrir otra sesión no da más cambios (diseño de 07, § 9).
  const limited = ctx.limit(
    (c) => [`catalog-changes:user:${sessionOf(c).userId}`],
    catalogSettings.limits.changes,
  );
  for (const { field, permission, body } of fields) {
    const read = readBody(bySchema(body as typeof marginBody));
    http.post(
      `/api/catalog/products/:id/${field}`,
      sessions.require,
      permissions.require(permission),
      limited,
      read.step,
      (c) => change(ctx, c, field, read.of(c) as MarginBody),
    );
  }
}
