// Buscar y ver productos (07 · R3, R4.1; diseño de 07, § 3 y § 5): la lista de a 50 desde el índice,
// con la página por sus identificadores; los dados de baja, desde la base; las marcas; y un producto con
// su cuenta para quien ve los costos. Todo pide sesión (E26).
import {
  type BrandsResponse,
  type Product,
  type ProductsPage,
  type ProductsQuery,
  productId,
  productsQuery,
} from '@ferrebress/shared/contracts/catalog';
import type { Found } from '@ferrebress/shared/search/index';
import type { Context } from 'hono';
import { fail } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import { pagesData } from '../data-pages.ts';
import { productOf, rowOf } from '../rules/views.ts';
import { catalogSettings } from '../settings.ts';
import type { CatalogContext } from './context.ts';
import { seesCosts } from './context.ts';

// La última búsqueda de cada sesión, para las páginas siguientes sin volver a buscar.
function createSearches(ctx: CatalogContext) {
  const kept = new Map<string, { key: string; found: Found; at: number }>();
  return (sessionId: string, query: ProductsQuery): Found => {
    const now = ctx.platform.clock.now().getTime();
    for (const [id, one] of kept) if (now - one.at > catalogSettings.searchKeepMs) kept.delete(id);
    const key = JSON.stringify([query.q ?? '', query.brand, query.show]);
    const last = kept.get(sessionId);
    const found =
      last?.key === key && query.after
        ? last.found
        : ctx.index.search({
            text: query.q ?? '',
            brand: query.brand,
            noPrice: query.show === 'noPrice',
          });
    kept.set(sessionId, { key, found, at: now });
    return found;
  };
}

// Dónde sigue la lista de los dados de baja: la clave y el identificador del último, o nada si no
// tiene esa forma.
function lastOf(after: string): { key: string; id: string } | undefined {
  try {
    const [key, id, ...rest] = JSON.parse(after) as unknown[];
    const fits = typeof key === 'string' && productId.safeParse(id).success && rest.length === 0;
    return fits ? { key, id: id as string } : undefined;
  } catch {
    return undefined;
  }
}

const validAfter = (query: ProductsQuery) =>
  !query.after ||
  (query.show === 'discontinued'
    ? lastOf(query.after) !== undefined
    : /^\d{1,7}$/.test(query.after));

// Los dados de baja (R1.6): `after` es la clave y el identificador del último.
async function discontinued(ctx: CatalogContext, c: Context, query: ProductsQuery) {
  const after = query.after ? lastOf(query.after) : undefined;
  const { page } = catalogSettings;
  const rows = await pagesData(ctx.db).discontinued(after, page);
  const shown = rows.slice(0, page);
  const last = shown.at(-1);
  const counts = ctx.index.search({ text: '', brand: query.brand });
  return c.json<ProductsPage>({
    products: shown.map((row) => rowOf(row, seesCosts(c))),
    ...(rows.length > page && last && { next: JSON.stringify([last.key, last.id]) }),
    total: counts.total,
    noPrice: counts.noPrice,
    stepCents: ctx.roundingStep(),
  });
}

export function registerProductRoutes(ctx: CatalogContext): void {
  const { http, sessions } = ctx.platform;
  const search = createSearches(ctx);
  const limited = ctx.limit(
    (c) => [`catalog-search:session:${sessionOf(c).id}`],
    catalogSettings.limits.search,
  );

  http.get('/api/catalog/products', sessions.require, limited, async (c) => {
    const parsed = productsQuery.safeParse(c.req.query());
    if (!parsed.success || !validAfter(parsed.data)) return fail(c, 400, 'bad-request');
    const query = parsed.data;
    if (query.show === 'discontinued') return discontinued(ctx, c, query);
    const found = search(sessionOf(c).id, query);
    const { page } = catalogSettings;
    const from = Number(query.after ?? 0);
    const rows = await pagesData(ctx.db).byIds(found.ids.slice(from, from + page));
    return c.json<ProductsPage>({
      products: rows.map((row) => rowOf(row, seesCosts(c))),
      ...(from + page < found.ids.length && { next: String(from + page) }),
      total: found.total,
      noPrice: found.noPrice,
      stepCents: ctx.roundingStep(),
    });
  });

  http.get('/api/catalog/brands', sessions.require, (c) =>
    c.json<BrandsResponse>({ brands: ctx.index.brands() }),
  );

  http.get('/api/catalog/products/:id', sessions.require, async (c) => {
    const id = c.req.param('id');
    if (!productId.safeParse(id).success) return fail(c, 404, 'not-found');
    const stored = await pagesData(ctx.db).one(id);
    if (!stored) return fail(c, 404, 'not-found');
    const sees = seesCosts(c);
    const source = sees ? await ctx.costSourceOf(id) : undefined;
    return c.json<Product>(productOf(stored, sees, ctx.roundingStep(), source));
  });
}
