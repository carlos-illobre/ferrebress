// Los proveedores desde la aplicación (08 · R1.3, R2; diseño de 08, § 3): quién ve qué, dar de alta,
// cambiar un dato con el que se vio, el nombre único y Quién hizo qué.
import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createPriceListsKit,
  type PriceListsKit,
} from '../../testing/price-lists/price-lists-kit.ts';
import { createDevice } from '../../testing/sign-in/sign-in-server.ts';

describe('los proveedores', () => {
  let kit: PriceListsKit;
  beforeAll(async () => {
    kit = await createPriceListsKit();
  });
  afterAll(() => kit.server.close());

  const create = (body: object, device = kit.admin) =>
    device.request('/api/price-lists/suppliers', body);
  const change = (id: string, body: object, device = kit.admin) =>
    device.request(`/api/price-lists/suppliers/${id}`, body);

  it('price-lists-E09: con solo el nombre, queda creado con cómo cobra de arranque', async () => {
    const created = await create({ name: '  Bulonera Centro ' });
    expect(created.status).toBe(200);
    expect(created.body).toEqual({
      id: expect.any(String),
      name: 'Bulonera Centro',
      inactive: false,
      terms: {
        value: { vatIncluded: false, discounts: [], defaultVat: 210, onChange: 'recalculate' },
        version: 1,
      },
    });
    const event = kit.audited('suppliers.created').at(-1);
    expect(event).toMatchObject({
      targets: [{ kind: 'supplier', id: created.body.id, name: 'Bulonera Centro' }],
      data: { filled: [] },
    });
  });

  it('price-lists-E01 y R1.3: sin permisos se ven los datos de contacto, sin costos', async () => {
    const id = (
      await create({ name: 'Aceros Sur', seller: 'Marta', phone: '11 5555-0000', note: 'Martes' })
    ).body.id;
    await kit.pendingList(id, []);
    const row = (await kit.seller.device.request('/api/price-lists/suppliers')).body.suppliers.find(
      (one: { id: string }) => one.id === id,
    );
    expect(row).toEqual({
      id,
      name: 'Aceros Sur',
      seller: 'Marta',
      phone: '11 5555-0000',
      note: 'Martes',
    });
    const one = await kit.seller.device.request(`/api/price-lists/suppliers/${id}`);
    expect(one.body.terms).toBeUndefined();
  });

  it('price-lists-E02 y R1.1: con «Ver costos», cómo cobra y si tiene una lista viva; no cambia nada', async () => {
    const id = await kit.supplier('Corralón Norte');
    await kit.pendingList(id, []);
    const rows = (await kit.viewer.device.request('/api/price-lists/suppliers')).body.suppliers;
    expect(rows.find((one: { id: string }) => one.id === id)).toMatchObject({ liveList: true });
    expect(
      (await kit.viewer.device.request(`/api/price-lists/suppliers/${id}`)).body.terms,
    ).toEqual({
      value: expect.objectContaining({ defaultVat: 210 }),
      version: 1,
    });
    const refused = await create({ name: 'Otro' }, kit.viewer.device);
    expect(refused.status).toBe(403);
    expect(refused.body.permission).toBe('price-lists.suppliers');
    expect(
      (await change(id, { field: 'note', before: null, value: 'x' }, kit.viewer.device)).status,
    ).toBe(403);
  });

  it('price-lists-R1.1: la fecha de la última lista y el correo, a quien tiene «Ver costos»', async () => {
    const id = (await create({ name: 'Grifería Sur', email: 'ventas@example.com' })).body.id;
    await sql`update price_lists.suppliers set last_list_date = '2026-08-14' where id = ${id}`.execute(
      kit.server.platform.db,
    );
    const rows = (await kit.viewer.device.request('/api/price-lists/suppliers')).body.suppliers;
    expect(rows.find((one: { id: string }) => one.id === id)).toEqual({
      id,
      name: 'Grifería Sur',
      email: 'ventas@example.com',
      lastListDate: '2026-08-14',
    });
    const one = (await kit.viewer.device.request(`/api/price-lists/suppliers/${id}`)).body;
    expect(one.lastListDate).toBe('2026-08-14');
    const hidden = (await kit.seller.device.request(`/api/price-lists/suppliers/${id}`)).body;
    expect(hidden.lastListDate).toBeUndefined();
  });

  it('price-lists-E06: sin sesión no se ve nada', async () => {
    const outsider = createDevice(kit.server);
    expect((await outsider.request('/api/price-lists/suppliers')).status).toBe(401);
    expect((await outsider.request('/api/price-lists/suppliers', { name: 'X' })).status).toBe(401);
  });

  it('price-lists-R2.2 y E31b: con «Cargar listas» da de alta, pero no cambia', async () => {
    const created = await create({ name: 'Pinturería Oeste' }, kit.loader.device);
    expect(created.status).toBe(200);
    const refused = await change(
      created.body.id,
      { field: 'note', before: null, value: 'x' },
      kit.loader.device,
    );
    expect(refused.status).toBe(403);
  });

  it('price-lists-E10: un nombre que ya existe, sin distinguir acentos ni mayúsculas, no se guarda', async () => {
    await create({ name: 'Ferretera del Sur' });
    expect((await create({ name: 'ferretera  del SUR' })).body).toEqual({
      error: 'supplier-exists',
    });
    const other = (await create({ name: 'Ferretera Andina' })).body.id;
    const renamed = await change(other, {
      field: 'name',
      before: 'Ferretera Andina',
      value: 'Ferretéra del sur',
    });
    expect(renamed.status).toBe(409);
    expect(renamed.body).toEqual({ error: 'supplier-exists' });
    // El suyo, con otras mayúsculas, sí.
    const same = await change(other, {
      field: 'name',
      before: 'Ferretera Andina',
      value: 'FERRETERA ANDINA',
    });
    expect(same.body.name).toBe('FERRETERA ANDINA');
  });

  it('price-lists-E11: el teléfono se guarda y Quién hizo qué dice que cambió, sin los números', async () => {
    const id = (await create({ name: 'Sanitarios Este', phone: '11 1111-1111' })).body.id;
    const saved = await change(id, {
      field: 'phone',
      before: '11 1111-1111',
      value: '11 2222-2222',
    });
    expect(saved.body.phone).toBe('11 2222-2222');
    const event = kit.audited('suppliers.changed').at(-1);
    expect(event?.data).toEqual({ field: 'phone' });
    expect(event?.changes).toBeUndefined();
    expect(JSON.stringify(event)).not.toContain('1111');
    expect(kit.audited('suppliers.created').at(-1)?.data).toEqual({ filled: ['phone'] });
  });

  it('price-lists-R9.1: el nombre y la nota van con lo anterior y lo nuevo', async () => {
    const id = await kit.supplier('Maderera Uno');
    await change(id, { field: 'note', before: null, value: 'Entrega los jueves' });
    expect(kit.audited('suppliers.changed').at(-1)?.changes).toEqual({
      note: { before: null, after: 'Entrega los jueves' },
    });
    const cleared = await change(id, { field: 'note', before: 'Entrega los jueves', value: '  ' });
    expect(cleared.body.note).toBeUndefined();
  });

  it('price-lists-R1.7: otro cambió el mismo dato antes; dos datos distintos no chocan', async () => {
    const id = await kit.supplier('Vidriería Dos');
    await change(id, { field: 'phone', before: null, value: '1' }, kit.manager.device);
    const late = await change(id, { field: 'phone', before: null, value: '2' });
    expect(late.status).toBe(409);
    expect(late.body).toEqual({ error: 'field-changed', value: '1' });
    expect((await change(id, { field: 'note', before: null, value: 'n' })).status).toBe(200);
  });

  it('un dato que no vale no se guarda y se dice cuál', async () => {
    const id = await kit.supplier('Electricidad Tres');
    for (const [field, value] of [
      ['email', 'no-es-correo'],
      ['name', ' '],
      ['name', null],
      ['phone', 'x'.repeat(41)],
    ] as const) {
      const refused = await change(id, { field, before: null, value });
      expect(refused.status).toBe(400);
      expect(refused.body).toMatchObject({ error: 'invalid-field', field });
    }
    expect((await create({ name: 'x'.repeat(81) })).body).toMatchObject({ field: 'name' });
    expect((await create({ name: 'Ok', email: 'mal' })).body).toMatchObject({ field: 'email' });
    expect((await change(id, { field: 'cuit', before: null, value: '1' })).status).toBe(400);
    const missing = kit.uuid();
    expect((await change(missing, { field: 'note', before: null, value: 'x' })).status).toBe(404);
    expect((await kit.admin.request(`/api/price-lists/suppliers/${missing}`)).status).toBe(404);
  });
});
