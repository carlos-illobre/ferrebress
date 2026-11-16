// Las listas de un proveedor (08 · R6.7) y sus productos (R8), con «Ver costos»: de a páginas, con
// quién subió y quién decidió cada lista, y cada producto con su costo y su cuenta.
import {
  type ItemsPage,
  itemsPageSize,
  itemsQuery,
  type SupplierList,
  type SupplierListsPage,
} from '@ferrebress/shared/contracts/price-lists';
import { searchKey } from '@ferrebress/shared/text/search-key';
import type { Context } from 'hono';
import * as z from 'zod/mini';
import { fail, uuidParams } from '../../../platform/http.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { historyData, type ItemLine, type ListLine } from '../data/history.ts';
import { suppliersData } from '../data/suppliers.ts';

export const listsPageSize = 20;
const listsQuery = z.strictObject({
  after: z.optional(z.string().check(z.regex(/^[0-9a-f-]{36}$/))),
});

// Las listas con el nombre de quien las subió y decidió: un nombre por persona.
export async function listsOf(ctx: PriceListsContext, lines: ListLine[]): Promise<SupplierList[]> {
  const ids = [
    ...new Set(lines.flatMap((one) => [one.uploadedBy, ...(one.decidedBy ? [one.decidedBy] : [])])),
  ];
  const names = new Map<string, string | null>();
  for (const id of ids) names.set(id, await ctx.nameOf(id));
  return lines.map((one) => {
    const uploadedBy = names.get(one.uploadedBy);
    const decidedBy = one.decidedBy ? names.get(one.decidedBy) : null;
    return {
      ...{ id: one.id, status: one.status, fileName: one.fileName, file: one.file },
      uploadedAt: one.uploadedAt.toISOString(),
      ...(one.listDate && { listDate: one.listDate }),
      ...(uploadedBy && { uploadedBy }),
      ...(decidedBy && { decidedBy }),
      ...(one.decidedAt && { decidedAt: one.decidedAt.toISOString() }),
      ...(one.reason && { reason: one.reason }),
      ...(one.result && { result: one.result }),
    };
  });
}

export async function listsPage(ctx: PriceListsContext, supplierId: string, after?: string) {
  const lines = await historyData(asDb(ctx.platform.db)).lists(supplierId, after, listsPageSize);
  const shown = lines.slice(0, listsPageSize);
  const next = lines.length > listsPageSize ? shown.at(-1)?.id : undefined;
  return { lists: await listsOf(ctx, shown), ...(next && { next }) };
}

const itemOf = (one: ItemLine) => ({
  ...{ code: one.code, description: one.description, cost: one.cost, basis: one.basis },
  ...(one.brand && { brand: one.brand }),
  discontinued: one.discontinued,
  ...(one.discontinued && {
    goneSince: {
      ...(one.goneListId && { listId: one.goneListId }),
      ...(one.goneListDate && { listDate: one.goneListDate }),
    },
  }),
});

const encode = (one: ItemLine) =>
  Buffer.from(JSON.stringify([one.key, one.code])).toString('base64url');
function decode(cursor: string | undefined): [string, string] | undefined | 'bad' {
  if (cursor === undefined) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString());
    return Array.isArray(parsed) &&
      parsed.length === 2 &&
      parsed.every((part) => typeof part === 'string')
      ? (parsed as [string, string])
      : 'bad';
  } catch {
    return 'bad';
  }
}

export function registerHistoryRoutes(ctx: PriceListsContext) {
  const { http, sessions, permissions } = ctx.platform;
  const costs = permissions.require('price-lists.costs');
  const id = uuidParams('id');
  http.get('/api/price-lists/suppliers/:id/lists', sessions.require, costs, id, async (c) => {
    const query = listsQuery.safeParse(c.req.query());
    if (!query.success) return fail(c, 400, 'bad-request');
    if (!(await suppliersData(asDb(ctx.platform.db)).one(c.req.param('id'))))
      return fail(c, 404, 'not-found');
    return c.json<SupplierListsPage>(await listsPage(ctx, c.req.param('id'), query.data.after));
  });
  http.get('/api/price-lists/suppliers/:id/items', sessions.require, costs, id, (c) =>
    items(ctx, c),
  );
}

async function items(ctx: PriceListsContext, c: Context) {
  const query = itemsQuery.safeParse(c.req.query());
  const after = decode(query.data?.after);
  if (!query.success || after === 'bad') return fail(c, 400, 'bad-request');
  const supplierId = c.req.param('id') as string;
  if (!(await suppliersData(asDb(ctx.platform.db)).one(supplierId)))
    return fail(c, 404, 'not-found');
  const found = await historyData(asDb(ctx.platform.db)).items(
    supplierId,
    {
      discontinued: query.data.discontinued === 'true',
      key: query.data.q ? searchKey(query.data.q) : undefined,
      after,
    },
    itemsPageSize,
  );
  const shown = found.slice(0, itemsPageSize);
  const last = shown.at(-1);
  return c.json<ItemsPage>({
    items: shown.map(itemOf),
    ...(found.length > itemsPageSize && last && { next: encode(last) }),
  });
}
