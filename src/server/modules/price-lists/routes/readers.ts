// Más → Administración → Lectores (08 · R5.8; diseño de 08, § 3): los ve cualquiera con sesión, sin su
// código ni, sin «Ver costos», su última lista; quien tiene «Cambiar los ajustes» desactiva uno que lee mal (vale desde la planilla
// siguiente, R5.9, E50) o lo vuelve a activar, y asocia uno de un programador a un proveedor (R5.1).
// Uno que queda activo puede entender una lista que no se pudo leer: se vuelve a leer (diseño, § 8).
import {
  type ReadersResponse,
  type ReaderView,
  readerActiveBody,
  readerSupplierBody,
} from '@ferrebress/shared/contracts/price-lists';
import type { Context } from 'hono';
import { bySchema, readBody } from '../../../platform/guards.ts';
import { fail, uuidParams } from '../../../platform/http.ts';
import { permissionsOf } from '../../../platform/permissions.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { type ReaderLine, readerAdminData } from '../data/reader-admin.ts';
import { readingData } from '../data/reading.ts';
import { suppliersData } from '../data/suppliers.ts';
import type { Reading } from '../reading/service.ts';
import { priceListsSettings } from '../settings.ts';

// La última lista de cada lector, solo con «Ver costos»: sin él no se ven listas (R1.3).
const viewOf = (line: ReaderLine, costs = true): ReaderView => ({
  id: line.id,
  origin: line.origin,
  active: line.active,
  createdAt: line.createdAt.toISOString(),
  ...(line.supplierId && { supplier: { id: line.supplierId, name: line.supplierName as string } }),
  ...(costs &&
    line.lastListId && {
      lastList: {
        id: line.lastListId,
        fileName: line.lastFileName as string,
        ...(line.lastListDate && { listDate: line.lastListDate }),
      },
    }),
});

const seesCosts = (c: Context) => permissionsOf(c).includes('price-lists.costs');

const readerTarget = (line: ReaderLine) => ({ kind: 'reader', id: line.id });

export function registerReaderRoutes(ctx: PriceListsContext, reading: Reading) {
  const { http, sessions, permissions } = ctx.platform;
  const change = permissions.require('settings.change');
  const id = uuidParams('id');
  const limited = ctx.limit(
    (c) => [`price-lists:readers:${sessionOf(c).id}`],
    priceListsSettings.changes,
  );
  const active = readBody(bySchema(readerActiveBody));
  const supplier = readBody(bySchema(readerSupplierBody));
  const base = '/api/price-lists/readers';

  http.get(base, sessions.require, async (c) =>
    c.json<ReadersResponse>({
      readers: (await readerAdminData(asDb(ctx.platform.db)).list()).map((line) =>
        viewOf(line, seesCosts(c)),
      ),
    }),
  );
  http.post(`${base}/:id/active`, sessions.require, change, id, limited, active.step, (c) =>
    setActive(ctx, c, reading, active.of(c).active),
  );
  http.post(`${base}/:id/supplier`, sessions.require, change, id, limited, supplier.step, (c) =>
    assignSupplier(ctx, c, reading, supplier.of(c).supplierId),
  );
}

async function setActive(ctx: PriceListsContext, c: Context, reading: Reading, active: boolean) {
  const data = readerAdminData(asDb(ctx.platform.db));
  const line = await data.one(c.req.param('id') as string);
  if (!line) return fail(c, 404, 'not-found');
  // El nuevo de una lista que espera se activa al aplicarla (R5.7).
  if (line.pending) return fail(c, 409, 'reader-pending');
  await data.setActive(line.id, active);
  ctx.record(c, active ? 'readers.activated' : 'readers.deactivated', {
    targets: [readerTarget(line)],
    data: { origin: line.origin, ...(line.supplierName && { supplier: line.supplierName }) },
  });
  if (active) await reread(ctx, reading);
  return c.json<ReaderView>(viewOf({ ...line, active }, seesCosts(c)));
}

async function assignSupplier(
  ctx: PriceListsContext,
  c: Context,
  reading: Reading,
  supplierId: string,
) {
  const db = asDb(ctx.platform.db);
  const data = readerAdminData(db);
  const line = await data.one(c.req.param('id') as string);
  const found = await suppliersData(db).one(supplierId);
  // Solo uno de un programador se asocia a mano: el automático ya es de su proveedor (R5.1).
  const assignable = line && !line.pending && line.origin === 'programmer';
  if (!assignable || !found || found.inactive) return fail(c, 404, 'not-found');
  await data.setSupplier(line.id, supplierId);
  ctx.record(c, 'readers.assigned', {
    targets: [readerTarget(line), { kind: 'supplier', id: found.id, name: found.name }],
    data: { origin: line.origin },
  });
  await reread(ctx, reading);
  return c.json<ReaderView>(
    viewOf({ ...line, supplierId, supplierName: found.name }, seesCosts(c)),
  );
}

// Cambió el juego de lectores: se vuelve a leer la última de cada proveedor que no se pudo (R5.5, E47).
async function reread(ctx: PriceListsContext, reading: Reading) {
  for (const listId of await readingData(asDb(ctx.platform.db)).rereadable())
    await reading.start(listId);
}
