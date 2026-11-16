// De quién es una lista (08 · R4.3; diseño de 08, § 3): por su lector no se pregunta; por su nombre
// se pregunta; si no se sabe, se elige o se da de alta uno nuevo. Cambiar el deducido la vuelve a leer.
import { sql } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

// Una planilla con su título, y otra con un encabezado que reconoce el lector de Bulonera.
const named = (title: string) =>
  xlsx([[title], ['Artículo', 'Detalle', 'Lista'], ['X1', 'Pala', 500]]);
const known = xlsx([
  ['Código', 'Descripción', 'Precio'],
  ['B1', 'Mecha', 1000],
]);

describe('de quién es una lista', () => {
  let kit: ListsKit;
  let bulonera: string;
  let ixnova: string;
  beforeAll(async () => {
    kit = await createListsKit();
    [bulonera, ixnova] = [await kit.supplier('Bulonera Centro'), await kit.supplier('Ixnova')];
    // Un lector automático ya activo de Bulonera.
    const params = {
      columns: { code: 0, description: 1, price: 2 },
      labels: { code: 'codigo', description: 'descripcion', price: 'precio' },
    };
    await sql`insert into price_lists.readers (id, supplier_id, origin, template, params, created_at)
      values (${kit.uuid()}, ${bulonera}, 'auto', 'auto-1', ${JSON.stringify(params)}::jsonb, now())`.execute(
      kit.server.platform.db,
    );
  });
  afterAll(() => kit.server.close());
  beforeEach(() => kit.later(61_000));

  const choose = (id: string, body: object, device = kit.loader.device) =>
    device.request(`/api/price-lists/lists/${id}/supplier`, body);

  it('price-lists-E29: por su lector no pregunta nada y queda en espera', async () => {
    const sent = await kit.upload(known);
    expect(await kit.list(sent.body.id)).toMatchObject({
      status: 'pending',
      supplier: { id: bulonera, from: 'reader', confirmed: true },
    });
  });

  it('price-lists-E29b: por su nombre pregunta; con «Sí», queda en espera', async () => {
    const sent = await kit.upload(named('IXNOVA de HNZ SRL'));
    const asked = await kit.list(sent.body.id);
    expect(asked).toMatchObject({
      status: 'reading',
      waitingFor: 'supplier',
      supplier: { id: ixnova, from: 'name', confirmed: false },
    });
    expect((await kit.rows(sent.body.id))[0]).toMatchObject({ code: 'X1', cost: '500000000' });
    const yes = await choose(sent.body.id, { supplierId: ixnova });
    expect(yes.body).toMatchObject({ status: 'pending', supplier: { confirmed: true } });
    expect(yes.body.waitingFor).toBeUndefined();
  });

  it('price-lists-E29c y E29d: «No, es de otro» la vuelve a leer como del elegido', async () => {
    const sent = await kit.upload(named('IXNOVA de HNZ SRL'));
    await choose(sent.body.id, { supplierId: bulonera });
    await kit.server.priceLists.idle();
    expect(await kit.list(sent.body.id)).toMatchObject({
      status: 'pending',
      supplier: { id: bulonera, from: 'chosen', confirmed: true },
    });
  });

  it('price-lists-E30, E31 y E31b: sin deducir, se elige uno nuevo y sigue sin volver a empezar', async () => {
    const sent = await kit.upload(named('Lista de precios'));
    const asked = await kit.list(sent.body.id);
    expect(asked).toMatchObject({ status: 'reading', waitingFor: 'supplier' });
    expect(asked.supplier).toBeUndefined();
    expect((await kit.rows(sent.body.id))[0]).toMatchObject({ code: 'X1', cost: null });
    const added = await choose(sent.body.id, {
      newSupplier: { name: 'Herrajes Sur', phone: '11 4444-0000' },
    });
    expect(added.body).toMatchObject({
      status: 'pending',
      supplier: { name: 'Herrajes Sur', from: 'chosen' },
    });
    expect((await kit.rows(sent.body.id))[0]).toMatchObject({ cost: '500000000', change: 'new' });
    const created = (
      await kit.admin.request(`/api/price-lists/suppliers/${added.body.supplier.id}`)
    ).body;
    expect(created.phone).toBe('11 4444-0000');
    const change = await kit.loader.device.request(`/api/price-lists/suppliers/${created.id}`, {
      field: 'phone',
      before: '11 4444-0000',
      value: '1',
    });
    expect(change.status).toBe(403);
    expect((await choose(sent.body.id, { newSupplier: { name: 'Herrajes Sur' } })).body).toEqual({
      error: 'supplier-exists',
    });
  });

  it('price-lists-E31e: cancelarla mientras espera la deja descartada, con su archivo', async () => {
    const sent = await kit.upload(named('Lista de precios'));
    const cancelled = await kit.loader.device.request(
      `/api/price-lists/lists/${sent.body.id}/cancel`,
      {},
    );
    expect(cancelled.body).toMatchObject({ status: 'discarded', reason: 'cancelled', file: true });
    expect(await kit.rows(sent.body.id)).toEqual([]);
    expect(kit.audited('lists.discarded').at(-1)).toMatchObject({ data: { reason: 'cancelled' } });
    for (const path of ['cancel', 'supplier', 'scope'])
      expect(
        (
          await kit.loader.device.request(
            `/api/price-lists/lists/${sent.body.id}/${path}`,
            path === 'supplier'
              ? { supplierId: ixnova }
              : path === 'scope'
                ? { scope: 'partial' }
                : {},
          )
        ).body,
      ).toEqual({ error: 'list-closed' });
  });

  it('price-lists-R4.7: completa o de solo cambios', async () => {
    const sent = await kit.upload(known, { scope: 'partial' });
    expect(sent.body.scope).toBe('partial');
    const full = await kit.loader.device.request(`/api/price-lists/lists/${sent.body.id}/scope`, {
      scope: 'full',
    });
    expect(full.body.scope).toBe('full');
  });

  it('una lista o un proveedor que no existen, 404', async () => {
    const missing = kit.uuid();
    for (const path of ['cancel', 'supplier', 'scope', 'size'])
      expect(
        (
          await kit.loader.device.request(
            `/api/price-lists/lists/${missing}/${path}`,
            path === 'supplier'
              ? { supplierId: ixnova }
              : path === 'scope'
                ? { scope: 'full' }
                : {},
          )
        ).status,
      ).toBe(404);
    const sent = await kit.upload(named('Lista de precios'));
    expect((await choose(sent.body.id, { supplierId: missing })).status).toBe(404);
  });
});

describe('una planilla grande', () => {
  let kit: ListsKit;
  beforeAll(async () => {
    kit = await createListsKit();
  });
  afterAll(() => kit.server.close());

  it('price-lists-E91: con más filas que el aviso, pregunta antes de leer; al confirmar, la lee entera', async () => {
    await kit.setting('confirmRows', 1000);
    const rows = [
      ['Código', 'Descripción', 'Precio'],
      ...Array.from({ length: 1200 }, (_, i) => [`C${i}`, 'x', 1]),
    ];
    const supplierId = await kit.supplier('Bulonera Centro');
    const sent = await kit.upload(xlsx(rows), { supplierId });
    expect(await kit.list(sent.body.id)).toMatchObject({
      status: 'reading',
      waitingFor: 'size',
      rowsTotal: 1201,
    });
    const go = await kit.loader.device.request(`/api/price-lists/lists/${sent.body.id}/size`, {});
    expect(go.status).toBe(200);
    await kit.server.priceLists.idle();
    expect(await kit.list(sent.body.id)).toMatchObject({ status: 'pending', rowsRead: 1201 });
    expect(
      (await kit.loader.device.request(`/api/price-lists/lists/${sent.body.id}/size`, {})).body,
    ).toEqual({
      error: 'list-closed',
    });
  });
});
