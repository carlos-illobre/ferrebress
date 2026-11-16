// El detalle de una lista (08 · R6.3, R6.4; diseño de 08, § 3), con «Ver costos»: de a 50, los que
// cambian primero, cada costo con su cuenta; o lo que se tocó del resumen: los nuevos, los que cambian,
// los iguales, los para revisar, las filas salteadas o los que ya no vienen. Se busca por código,
// descripción o marca.
import {
  type ListRow,
  type RowsPage,
  rowsPageSize,
  rowsQuery,
} from '@ferrebress/shared/contracts/price-lists';
import { searchKey } from '@ferrebress/shared/text/search-key';
import type { Context } from 'hono';
import { fail, uuidParams } from '../../../platform/http.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { readingData } from '../data/reading.ts';
import { reviewData } from '../data/review.ts';
import { cursorFrom, cursorOf, rowOf } from '../rules/review.ts';

const encode = (code: string) => Buffer.from(code).toString('base64url');
const decode = (cursor: string | undefined) =>
  cursor === undefined ? undefined : Buffer.from(cursor, 'base64url').toString();

export function registerRowsRoute(ctx: PriceListsContext) {
  const { http, sessions, permissions } = ctx.platform;
  http.get(
    '/api/price-lists/lists/:id/rows',
    sessions.require,
    permissions.require('price-lists.costs'),
    uuidParams('id'),
    (c) => rows(ctx, c),
  );
}

async function rows(ctx: PriceListsContext, c: Context) {
  const query = rowsQuery.safeParse(c.req.query());
  if (!query.success) return fail(c, 400, 'bad-request');
  const db = asDb(ctx.platform.db);
  const list = await readingData(db).one(c.req.param('id') as string);
  if (!list) return fail(c, 404, 'not-found');
  const key = query.data.q ? searchKey(query.data.q) : undefined;
  const review = reviewData(db);
  if (query.data.show === 'gone')
    return c.json<RowsPage>(await goneRows(review, list, key, query.data.after));
  const after = cursorFrom(query.data.after);
  if (after === 'bad') return fail(c, 400, 'bad-request');
  const found = await review.page(
    list.id,
    { show: query.data.show, key, after },
    ctx.settings().reviewPercent,
    rowsPageSize,
  );
  const shown = found.slice(0, rowsPageSize);
  const last = shown.at(-1);
  return c.json<RowsPage>({
    rows: shown.map(rowOf),
    ...(found.length > rowsPageSize && last && { next: cursorOf(last) }),
  });
}

// Los que ya no vienen (R7.4): los artículos del proveedor que la lista no trae, por código.
async function goneRows(
  review: ReturnType<typeof reviewData>,
  list: { id: string; supplierId: string | null },
  key: string | undefined,
  after: string | undefined,
): Promise<RowsPage> {
  const found = list.supplierId
    ? await review.goneRows(list.id, list.supplierId, key, decode(after), rowsPageSize)
    : [];
  const shown = found.slice(0, rowsPageSize);
  const last = shown.at(-1);
  return {
    rows: shown.map(
      (one): ListRow => ({
        ...{ code: one.code, description: one.description, cost: one.cost, basis: one.basis },
        ...(one.brand && { brand: one.brand }),
      }),
    ),
    ...(found.length > rowsPageSize && last && { next: encode(last.code) }),
  };
}
