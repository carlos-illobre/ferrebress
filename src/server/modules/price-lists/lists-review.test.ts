// El detalle de una lista, las listas de un proveedor y sus productos (08 · R6.3, R6.4, R6.7, R8),
// con «Ver costos».
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

type Rows = (string | number)[][];
const sheet = (title: string, rows: Rows) =>
  xlsx([[title], ['Código', 'Descripción', 'Precio'], ...rows]);

describe('el detalle de una lista y los productos de un proveedor', () => {
  let kit: ListsKit;
  let supplierId: string;
  let pending: string;
  let first: string;
  beforeAll(async () => {
    kit = await createListsKit();
    supplierId = await kit.supplier('Bulonera Centro');
    const many: Rows = Array.from({ length: 60 }, (_, i) => [
      `N${String(i).padStart(2, '0')}`,
      `Nuevo ${i}`,
      10,
    ]);
    const before = await kit.upload(
      sheet('Lista 1/8/2026', [
        ['A1', 'Mecha', 100],
        ['A2', 'Tarugo', 100],
        ['A3', 'Clavo', 100],
        ['A4', 'Perno', 100],
      ]),
      { supplierId },
    );
    first = before.body.id;
    await kit.loader.device.request(`/api/price-lists/lists/${first}/apply`, {
      expected: { new: 4, changed: 0, gone: 0 },
    });
    await kit.server.priceLists.idle();
    kit.later(61_000);
    const after = await kit.upload(
      sheet('Lista 14/8/2026', [
        ['A1', 'Mecha', 180],
        ['A2', 'Tarugo', 130],
        ['A3', 'Clavo', 40],
        ['X1', 'Roto', 'x'],
        ...many,
      ]),
      { supplierId },
    );
    pending = after.body.id;
  });
  afterAll(() => kit.server.close());
  beforeEach(() => kit.later(61_000));

  const rows = async (query = '', device = kit.viewer.device) =>
    (await device.request(`/api/price-lists/lists/${pending}/rows${query}`)).body;

  it('price-lists-E56 y E57: los que cambian primero, con el costo que tenía, el nuevo y su cuenta; para revisar, los que pasan el porcentaje', async () => {
    const page = await rows();
    expect(
      page.rows
        .slice(0, 3)
        .map((one: { code: string; variation: number }) => [one.code, one.variation]),
    ).toEqual([
      ['A1', 80],
      ['A3', -60],
      ['A2', 30],
    ]);
    expect(page.rows[0]).toMatchObject({
      description: 'Mecha',
      change: 'changed',
      cost: '180000000',
      previous: '100000000',
      basis: { listPrice: '180000000', listDate: '2026-08-14' },
    });
    expect(page.rows).toHaveLength(50);
    const rest = await rows(`?after=${page.next}`);
    expect(rest.rows).toHaveLength(13);
    expect(rest.next).toBeUndefined();
    expect((await rows('?show=review')).rows.map((one: { code: string }) => one.code)).toEqual([
      'A1',
      'A3',
    ]);
    expect((await rows('?show=changed')).rows).toHaveLength(3);
    expect((await rows('?show=new')).rows).toHaveLength(50);
    expect((await rows('?show=same')).rows).toEqual([]);
  });

  it('price-lists-R6.3: se busca; las salteadas con lo que traían; los que ya no vienen', async () => {
    expect((await rows('?q=TARUGO')).rows.map((one: { code: string }) => one.code)).toEqual(['A2']);
    expect((await rows('?show=skipped')).rows).toEqual([
      { code: 'X1', description: 'Roto', skipped: 'not-a-number', cells: ['X1', 'Roto', 'x'] },
    ]);
    const gone = await rows('?show=gone');
    expect(gone.rows).toEqual([
      {
        code: 'A4',
        description: 'Perno',
        cost: '100000000',
        basis: expect.objectContaining({ listPrice: '100000000' }),
      },
    ]);
    expect((await rows('?show=gone&q=nada')).rows).toEqual([]);
    expect(
      (await kit.viewer.device.request(`/api/price-lists/lists/${pending}/rows?after=nada`)).status,
    ).toBe(400);
    expect(
      (await kit.viewer.device.request(`/api/price-lists/lists/${pending}/rows?show=otra`)).status,
    ).toBe(400);
    expect(
      (await kit.viewer.device.request(`/api/price-lists/lists/${kit.uuid()}/rows`)).status,
    ).toBe(404);
    expect((await kit.seller.device.request(`/api/price-lists/lists/${pending}/rows`)).status).toBe(
      403,
    );
  });

  it('price-lists-R6.7: las listas del proveedor, de la más nueva a la más vieja, con quién las subió y quién decidió', async () => {
    const supplier = (await kit.viewer.device.request(`/api/price-lists/suppliers/${supplierId}`))
      .body;
    expect(supplier.lists.lists.map((one: { id: string }) => one.id)).toEqual([pending, first]);
    expect(supplier.lists.lists[1]).toMatchObject({
      status: 'applied',
      listDate: '2026-08-01',
      uploadedBy: expect.any(String),
      decidedBy: expect.any(String),
      decidedAt: expect.any(String),
      result: { created: 4, changed: 0, gone: 0, restored: 0 },
      file: true,
    });
    expect(supplier.lists.next).toBeUndefined();
    const later = await kit.viewer.device.request(
      `/api/price-lists/suppliers/${supplierId}/lists?after=${pending}`,
    );
    expect(later.body.lists.map((one: { id: string }) => one.id)).toEqual([first]);
    const seller = (await kit.seller.device.request(`/api/price-lists/suppliers/${supplierId}`))
      .body;
    expect(seller.lists).toBeUndefined();
    expect(
      (await kit.viewer.device.request(`/api/price-lists/suppliers/${kit.uuid()}/lists`)).status,
    ).toBe(404);
    expect(
      (await kit.viewer.device.request(`/api/price-lists/suppliers/${supplierId}/lists?after=x`))
        .status,
    ).toBe(400);
  });

  it('price-lists-E78, E79 y R8.2: los productos en orden alfabético, buscados mientras se escribe, y los dados de baja aparte', async () => {
    const items = async (query = '') =>
      (await kit.viewer.device.request(`/api/price-lists/suppliers/${supplierId}/items${query}`))
        .body;
    expect((await items()).items.map((one: { description: string }) => one.description)).toEqual([
      'Clavo',
      'Mecha',
      'Perno',
      'Tarugo',
    ]);
    expect((await items('?q=mech')).items).toEqual([
      expect.objectContaining({
        code: 'A1',
        cost: '100000000',
        discontinued: false,
        basis: expect.any(Object),
      }),
    ]);
    expect((await items('?discontinued=true')).items).toEqual([]);
    await kit.loader.device.request(`/api/price-lists/lists/${pending}/apply`, {
      expected: { new: 60, changed: 3, gone: 1 },
    });
    await kit.server.priceLists.idle();
    const gone = (await items('?discontinued=true')).items;
    expect(gone).toEqual([
      expect.objectContaining({
        code: 'A4',
        discontinued: true,
        goneSince: { listId: pending, listDate: '2026-08-14' },
      }),
    ]);
    const page = await items();
    expect(page.items).toHaveLength(50);
    expect((await items(`?after=${page.next}`)).items).toHaveLength(13);
    expect(
      (await kit.viewer.device.request(`/api/price-lists/suppliers/${supplierId}/items?after=nada`))
        .status,
    ).toBe(400);
    const notJson = Buffer.from('[1]').toString('base64url');
    expect(
      (
        await kit.viewer.device.request(
          `/api/price-lists/suppliers/${supplierId}/items?after=${notJson}`,
        )
      ).status,
    ).toBe(400);
    expect(
      (await kit.viewer.device.request(`/api/price-lists/suppliers/${kit.uuid()}/items`)).status,
    ).toBe(404);
    expect(
      (await kit.seller.device.request(`/api/price-lists/suppliers/${supplierId}/items`)).status,
    ).toBe(403);
  });
});
