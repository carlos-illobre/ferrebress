// Más caminos al aplicar y al mirar (08 · R4.4, R6, R7, R8): el mismo archivo otra vez, una que falla,
// la cola cuando sale bien, cancelar desde la pantalla, y las páginas de las listas, de los que ya no
// vienen y de los productos de un proveedor dado de baja.
import { sql } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

type Rows = (string | number)[][];
const sheet = (title: string, rows: Rows) =>
  xlsx([[title], ['Código', 'Descripción', 'Precio'], ...rows]);
const many = (n: number, prefix = 'C') =>
  Array.from({ length: n }, (_, i): (string | number)[] => [
    `${prefix}${String(i).padStart(3, '0')}`,
    `Artículo ${i}`,
    10 + i,
  ]);

describe('más caminos al aplicar y al mirar', () => {
  let kit: ListsKit;
  beforeAll(async () => {
    kit = await createListsKit();
  });
  afterAll(() => kit.server.close());
  beforeEach(() => kit.later(61_000));

  const apply = async (id: string, expected: object) => {
    const sent = await kit.loader.device.request(`/api/price-lists/lists/${id}/apply`, {
      expected,
    });
    await kit.server.priceLists.idle();
    return sent;
  };
  const db = () => kit.server.platform.db;

  it('price-lists-E63: el mismo archivo otra vez dice que todos quedan igual y no duplica nada; el archivo sigue', async () => {
    const supplierId = await kit.supplier('Bulonera Centro');
    const file = sheet('Lista 1/8/2026', [['A1', 'Mecha', 100]]);
    const first = await kit.upload(file, { supplierId });
    await apply(first.body.id, { new: 1, changed: 0, gone: 0 });
    const again = await kit.upload(file, { supplierId });
    expect((await kit.list(again.body.id)).summary).toMatchObject({
      new: 0,
      changed: 0,
      same: 1,
      gone: 0,
    });
    await apply(again.body.id, { new: 0, changed: 0, gone: 0 });
    expect(await kit.list(first.body.id)).toMatchObject({ file: true });
    const items = await sql<{
      count: number;
    }>`select count(*)::int as count from price_lists.items where supplier_id = ${supplierId}`.execute(
      db(),
    );
    expect(items.rows[0]?.count).toBe(1);
    // Sin el archivo de la anterior (borrado a mano en Archivos de listas), aplicar no lo busca.
    const files = (await kit.viewer.device.request('/api/price-lists/files')).body.files;
    const stored = files.find((one: { lists: { id: string }[] }) =>
      one.lists.some((list) => list.id === again.body.id),
    );
    await kit.admin.request(`/api/price-lists/files/${stored.sha256}/delete`, {});
    kit.later(10_000);
    await kit.server.runJobs();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await kit.list(again.body.id)).toMatchObject({ file: false });
    const third = await kit.upload(sheet('Lista 2/8/2026', [['A1', 'Mecha', 120]]), { supplierId });
    await apply(third.body.id, { new: 0, changed: 1, gone: 0 });
    expect(await kit.list(third.body.id)).toMatchObject({ status: 'applied', file: true });
  });

  it('price-lists-R6.6: si aplicar falla, no queda nada y vuelve a esperar con el motivo', async () => {
    const supplierId = await kit.supplier('Aceros Sur');
    const sent = await kit.upload(sheet('Lista 1/8/2026', [['A1', 'Mecha', 100]]), { supplierId });
    // Una falla a propósito: un IVA que la base no acepta al crear el producto.
    await sql`update price_lists.list_rows set vat = 2000 where list_id = ${sent.body.id}`.execute(
      db(),
    );
    await apply(sent.body.id, { new: 1, changed: 0, gone: 0 });
    expect(await kit.list(sent.body.id)).toMatchObject({
      status: 'pending',
      reason: 'apply-failed',
    });
    const items = await sql<{
      count: number;
    }>`select count(*)::int as count from price_lists.items where supplier_id = ${supplierId}`.execute(
      db(),
    );
    expect(items.rows[0]?.count).toBe(0);
  });

  it('price-lists-E85: la que esperaba en la cola sigue sola cuando la otra se aplica bien', async () => {
    const supplierId = await kit.supplier('Corralón Norte');
    const first = await kit.upload(sheet('Lista 1/8/2026', [['A1', 'Mecha', 100]]), { supplierId });
    const release = kit.holdApply();
    await kit.loader.device.request(`/api/price-lists/lists/${first.body.id}/apply`, {
      expected: { new: 1, changed: 0, gone: 0 },
    });
    const queued = await kit.loader.device.request(
      `/api/price-lists/lists?name=lista.xlsx&supplierId=${supplierId}`,
      sheet('Lista 2/8/2026', [['Q1', 'Otro', 5]]),
      { 'Content-Type': 'application/octet-stream' },
    );
    expect(await kit.list(queued.body.id)).toMatchObject({ status: 'queued' });
    release();
    await kit.server.priceLists.idle();
    expect(await kit.list(first.body.id)).toMatchObject({ status: 'applied' });
    expect(await kit.list(queued.body.id)).toMatchObject({ status: 'pending' });
  });

  it('price-lists-R4.11: «Cancelar» desde la pantalla mientras se aplica', async () => {
    const supplierId = await kit.supplier('Pinturería Oeste');
    const sent = await kit.upload(sheet('Lista 1/8/2026', many(3000)), { supplierId });
    const release = kit.holdApply();
    const started = kit.loader.device.request(`/api/price-lists/lists/${sent.body.id}/apply`, {
      expected: { new: 3000, changed: 0, gone: 0 },
    });
    // Mientras se aplica, se cancela desde la pantalla.
    expect((await started).body).toMatchObject({ status: 'applying' });
    const cancelled = await kit.loader.device.request(
      `/api/price-lists/lists/${sent.body.id}/cancel`,
      {},
    );
    expect(cancelled).toMatchObject({ status: 202, body: { cancelling: true } });
    release();
    await kit.server.priceLists.idle();
    expect(await kit.list(sent.body.id)).toMatchObject({ status: 'pending', reason: 'cancelled' });
  });

  it('price-lists-R6.7 y R6.3: las listas de a 20, con su motivo, y los que ya no vienen de a 50', async () => {
    const supplierId = await kit.supplier('Sanitarios Este');
    const first = await kit.upload(sheet('Lista 1/8/2026', [['BREMEN'], ...many(52)]), {
      supplierId,
    });
    await apply(first.body.id, { new: 52, changed: 0, gone: 0 });
    const second = await kit.upload(sheet('Lista 2/8/2026', [['Z1', 'Nuevo', 1]]), { supplierId });
    const page = (
      await kit.viewer.device.request(`/api/price-lists/lists/${second.body.id}/rows?show=gone`)
    ).body;
    expect(page.rows).toHaveLength(50);
    const rest = (
      await kit.viewer.device.request(
        `/api/price-lists/lists/${second.body.id}/rows?show=gone&after=${page.next}`,
      )
    ).body;
    expect(rest.rows.map((one: { code: string }) => one.code)).toEqual(['C050', 'C051']);
    expect(rest.rows[0].brand).toBe('BREMEN');
    const brandRows = (
      await kit.viewer.device.request(`/api/price-lists/lists/${first.body.id}/rows?show=same`)
    ).body;
    expect(brandRows.rows).toEqual([]);
    const items = (
      await kit.viewer.device.request(`/api/price-lists/suppliers/${supplierId}/items?q=bremen`)
    ).body.items;
    expect(items[0]).toMatchObject({ brand: 'BREMEN' });
    // 20 más del mismo proveedor: cada una reemplaza a la que esperaba (R4.8). De a 10 por minuto.
    for (let i = 0; i < 20; i++) {
      if (i % 10 === 0) kit.later(61_000);
      await kit.upload(sheet('Otra', [[`N${i}`, 'Otro', 1]]), { supplierId });
    }
    const lists = (await kit.viewer.device.request(`/api/price-lists/suppliers/${supplierId}`)).body
      .lists;
    expect(lists.lists).toHaveLength(20);
    expect(lists.next).toEqual(expect.any(String));
    const more = (
      await kit.viewer.device.request(
        `/api/price-lists/suppliers/${supplierId}/lists?after=${lists.next}`,
      )
    ).body;
    expect(more.lists.map((one: { id: string }) => one.id)).toEqual([
      second.body.id,
      first.body.id,
    ]);
    expect(more.lists[0]).toMatchObject({ status: 'discarded', reason: 'replaced' });
    expect(more.next).toBeUndefined();
  });

  it('una lista que espera de quién es no tiene «ya no vienen»; los productos de un proveedor dado de baja, sin lista', async () => {
    const waiting = await kit.upload(
      xlsx([['Lista'], ['Artículo', 'Detalle', 'Lista'], ['X1', 'Pala', 1]]),
    );
    expect(
      (await kit.viewer.device.request(`/api/price-lists/lists/${waiting.body.id}/rows?show=gone`))
        .body,
    ).toEqual({ rows: [] });
    const supplierId = await kit.supplier('Herrería Cinco');
    const sent = await kit.upload(sheet('Lista 1/8/2026', [['A1', 'Mecha', 100]]), { supplierId });
    await apply(sent.body.id, { new: 1, changed: 0, gone: 0 });
    await kit.admin.request(`/api/price-lists/suppliers/${supplierId}/deactivate`, {
      confirmed: { costs: 1, discontinued: 1 },
    });
    const items = (
      await kit.viewer.device.request(
        `/api/price-lists/suppliers/${supplierId}/items?discontinued=true`,
      )
    ).body.items;
    expect(items).toEqual([
      expect.objectContaining({ code: 'A1', discontinued: true, goneSince: {} }),
    ]);
  });
});
