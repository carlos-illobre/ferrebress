// Lo que se borra solo (08 · R4.4; 06 · R8.6, R8.7, R10.2; diseño de 08, § 8): los archivos marcados a
// mano con el «Deshacer» vencido, los de listas que nunca se aplicaron pasados los días del ajuste, los
// más viejos cuando entre todos pasan el tamaño, los que quedaron sin fila y las filas leídas viejas.
// Los archivos son un respaldo: lo que importa son los productos.
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { filesData } from '../data/files.ts';

import { priceListsSettings } from '../settings.ts';

const day = 24 * 60 * 60_000;

// Cada uno: las listas dicen que ya no se guarda y sale del almacén.
async function remove(ctx: PriceListsContext, shas: readonly string[]) {
  const data = filesData(asDb(ctx.platform.db));
  for (const sha of shas) {
    await data.forget(sha);
    await ctx.platform.files.remove(sha);
  }
}

// Al guardar uno nuevo: los más viejos, hasta quedar por debajo del tamaño (E89).
export async function keepUnderLimit(ctx: PriceListsContext) {
  const limit = ctx.settings().filesMb * 2 ** 20;
  await remove(ctx, await filesData(asDb(ctx.platform.db)).overflow(limit));
}

export async function cleanUp(ctx: PriceListsContext) {
  const now = ctx.platform.clock.now().getTime();
  const data = filesData(asDb(ctx.platform.db));
  const days = ctx.settings().unappliedFileDays;
  const { undoMs, rowsKeepMs } = priceListsSettings;
  await remove(ctx, await data.due(new Date(now - undoMs), new Date(now - days * day)));
  await keepUnderLimit(ctx);
  const known = await data.known();
  for (const sha of await ctx.platform.files.list())
    if (!known.has(sha)) await ctx.platform.files.remove(sha);
  await data.dropOldRows(new Date(now - rowsKeepMs));
}
