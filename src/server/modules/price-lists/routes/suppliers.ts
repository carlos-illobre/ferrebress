// Las rutas de los proveedores (08 · R1.3, R2; diseño de 08, § 3): verlos con cualquier sesión, sus
// datos de cobro con «Ver costos», y darlos de alta y cambiarlos con «Administrar proveedores». Quien
// tiene «Cargar listas» da de alta uno nuevo al subir su lista, por la ruta de la lista (R2.2).
import {
  type ChangeSupplierBody,
  changeSupplierBody,
  type FieldChanged,
  initialTerms,
  type NewSupplierBody,
  newSupplierBody,
  privateSupplierFields,
  type SupplierExists,
  type SupplierResponse,
  type SuppliersResponse,
  supplierValue,
} from '@ferrebress/shared/contracts/price-lists';
import { searchKey } from '@ferrebress/shared/text/search-key';
import type { Context, MiddlewareHandler } from 'hono';
import { bySchema, readBody } from '../../../platform/guards.ts';
import { fail, uuidParams } from '../../../platform/http.ts';
import { newId } from '../../../platform/ids.ts';
import { permissionsOf } from '../../../platform/permissions.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { type SupplierRecord, suppliersData } from '../data/suppliers.ts';
import type { Reading } from '../reading/service.ts';
import { newSupplierOf, responseOf, rowOf, supplierTarget } from '../rules/suppliers.ts';
import { priceListsSettings } from '../settings.ts';
import { listsPage } from './history.ts';
import { registerSupplierStateRoutes } from './supplier-state.ts';

const seesCosts = (c: Context) => permissionsOf(c).includes('price-lists.costs');

export function registerSupplierRoutes(ctx: PriceListsContext, reading: Reading) {
  const { http, sessions, permissions } = ctx.platform;
  const data = suppliersData(asDb(ctx.platform.db));
  const manage = permissions.require('price-lists.suppliers');
  const id = uuidParams('id');
  const limited = ctx.limit(
    (c) => [`price-lists:suppliers:${sessionOf(c).id}`],
    priceListsSettings.changes,
  );
  const created = readBody(bySchema(newSupplierBody));
  const changed = readBody(bySchema(changeSupplierBody));

  registerSupplierReads(ctx, data, { manage, id });

  http.post(
    '/api/price-lists/suppliers',
    sessions.require,
    manage,
    limited,
    created.step,
    async (c) => create(ctx, c, data, created.of(c)),
  );

  http.post(
    '/api/price-lists/suppliers/:id',
    sessions.require,
    manage,
    id,
    limited,
    changed.step,
    async (c) => change(ctx, c, data, changed.of(c)),
  );

  registerSupplierStateRoutes(ctx, reading, { manage, id, limited });
}

// Ver los proveedores: los activos y uno, con cualquier sesión (R1.3); los dados de baja, con
// «Administrar proveedores» (R2.5).
function registerSupplierReads(
  ctx: PriceListsContext,
  data: ReturnType<typeof suppliersData>,
  { manage, id }: { manage: MiddlewareHandler; id: MiddlewareHandler },
) {
  const { http, sessions } = ctx.platform;
  http.get('/api/price-lists/suppliers', sessions.require, async (c) => {
    const costs = seesCosts(c);
    const [records, live] = await Promise.all([
      data.list(false),
      costs ? data.withLiveList() : new Set<string>(),
    ]);
    return c.json<SuppliersResponse>({
      suppliers: records.map((record) => rowOf(record, costs, live.has(record.id))),
    });
  });

  http.get('/api/price-lists/suppliers/inactive', sessions.require, manage, async (c) =>
    c.json<SuppliersResponse>({
      suppliers: (await data.list(true)).map((record) => rowOf(record, false, false)),
    }),
  );

  http.get('/api/price-lists/suppliers/:id', sessions.require, id, async (c) => {
    const record = await data.one(c.req.param('id'));
    if (!record) return fail(c, 404, 'not-found');
    const costs = seesCosts(c);
    const response = responseOf(record, costs);
    return c.json<SupplierResponse>(
      costs ? { ...response, lists: await listsPage(ctx, record.id) } : response,
    );
  });
}

// Un alta (R2.2): con el nombre de otro, 409 (E10, E94). Del vendedor, el teléfono y el correo,
// Quién hizo qué guarda solo cuáles se cargaron.
async function create(
  ctx: PriceListsContext,
  c: Context,
  data: ReturnType<typeof suppliersData>,
  body: NewSupplierBody,
) {
  const added = await addSupplier(ctx, c, data, body);
  return added instanceof Response
    ? added
    : c.json<SupplierResponse>(responseOf(added, seesCosts(c)));
}

// Da de alta un proveedor y lo anota; si no se puede, la respuesta que lo dice. Lo usa también la
// ruta de una lista, al dar de alta el de una lista nueva (R2.2, E31b).
export async function addSupplier(
  ctx: PriceListsContext,
  c: Context,
  data: ReturnType<typeof suppliersData>,
  body: NewSupplierBody,
): Promise<SupplierRecord | Response> {
  const values = newSupplierOf(body);
  if ('invalid' in values) return fail(c, 400, 'invalid-field', { field: values.invalid });
  const record = { id: newId(ctx.platform.clock), ...values, terms: initialTerms() };
  const nameKey = searchKey(values.name);
  if (!(await data.create({ ...record, nameKey })))
    return exists(c, (await data.byNameKey(nameKey)) as { id: string; inactive: boolean });
  ctx.record(c, 'suppliers.created', {
    targets: [supplierTarget(record)],
    data: { filled: privateSupplierFields.filter((field) => record[field] !== null) },
  });
  return { ...record, termsVersion: 1, inactive: false, lastListId: null, lastListDate: null };
}

// El nombre ya lo tiene otro: si está dado de baja, se ofrece reactivarlo (E94).
const exists = (c: Context, other: { id: string; inactive: boolean }) =>
  c.json<SupplierExists>(
    other.inactive ? { error: 'supplier-inactive', id: other.id } : { error: 'supplier-exists' },
    409,
  );

// Un dato (R1.7): solo si sigue siendo el que se vio; si no, 409 con el de ahora. Del vendedor, el
// teléfono y el correo, Quién hizo qué guarda solo qué cambió (R9.1, E11).
async function change(
  ctx: PriceListsContext,
  c: Context,
  data: ReturnType<typeof suppliersData>,
  { field, before, value: raw }: ChangeSupplierBody,
) {
  const supplierId = c.req.param('id') as string;
  const value = supplierValue(field, raw);
  if (value === undefined) return fail(c, 400, 'invalid-field', { field });
  const now = await data.one(supplierId);
  if (!now) return fail(c, 404, 'not-found');
  const nameKey = field === 'name' ? searchKey(value as string) : undefined;
  const other = nameKey === undefined ? undefined : await data.byNameKey(nameKey);
  if (other && other.id !== supplierId) return exists(c, other);
  if (!(await data.change(supplierId, field, before, value, nameKey)))
    return c.json<FieldChanged>({ error: 'field-changed', value: now[field] }, 409);
  const after = { ...now, [field]: value };
  ctx.record(c, 'suppliers.changed', {
    targets: [supplierTarget(after)],
    data: { field },
    ...(!privateSupplierFields.includes(field) && {
      changes: { [field]: { before: now[field], after: value } },
    }),
  });
  return c.json<SupplierResponse>(responseOf(after, seesCosts(c)));
}
