// Ver qué cambia y aplicar una lista (08 · R6, R7, R9; diseño de 08, § 3): el resumen, aplicar con
// los números del botón, lo que hace en los productos, Quién hizo qué y las anomalías.
import { sql } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

type Rows = (string | number)[][];
const sheet = (title: string, rows: Rows) =>
  xlsx([[title], ['Código', 'Descripción', 'Precio'], ...rows]);

describe('aplicar una lista', () => {
  let kit: ListsKit;
  beforeAll(async () => {
    kit = await createListsKit();
  });
  afterAll(() => kit.server.close());
  beforeEach(() => kit.later(61_000));

  const apply = async (id: string, expected: object, device = kit.loader.device) => {
    const sent = await device.request(`/api/price-lists/lists/${id}/apply`, { expected });
    await kit.server.priceLists.idle();
    return sent;
  };
  const productOf = async (supplierId: string, code: string) => {
    const found = await sql<{ product_id: string }>`select product_id from price_lists.items
      where supplier_id = ${supplierId} and supplier_code = ${code}`.execute(
      kit.server.platform.db,
    );
    const [product] = await kit.products([found.rows[0]?.product_id as string]);
    return product;
  };

  it('price-lists-E54, E69, E60, E81 y E80: una lista nueva crea sus productos, se ve lo que hizo y queda la anomalía de las salteadas', async () => {
    const supplierId = await kit.supplier('Bulonera Centro');
    const rows: Rows = [
      ['A1', 'Mecha 6', 100],
      ['A2', 'Mecha 8', 200],
      ['A3', 'Tarugo', 300],
      ['A4', 'Clavo', 400],
      ['A5', 'Sin precio', ''],
    ];
    const sent = await kit.upload(sheet('Lista 14/8/2026', rows), { supplierId });
    const pending = await kit.list(sent.body.id);
    expect(pending.summary).toEqual({
      ...{ new: 4, changed: 0, same: 0, gone: 0, skipped: 1, reasons: { 'no-price': 1 } },
      ...{ averageChange: null, review: 0, goneWarning: false, tooOld: false },
    });
    const applied = await apply(sent.body.id, { new: 4, changed: 0, gone: 0 });
    expect(applied.status).toBe(202);
    expect(applied.body.status).toBe('applying');
    const done = await kit.list(sent.body.id);
    expect(done).toMatchObject({
      status: 'applied',
      result: { created: 4, changed: 0, gone: 0, restored: 0 },
    });
    expect(await productOf(supplierId, 'A1')).toMatchObject({
      description: 'Mecha 6',
      unit: 'un.',
      vat: 210,
      cost: 100_000_000n,
      supplierId,
      discontinued: false,
    });
    expect(
      (await kit.admin.request(`/api/price-lists/suppliers/${supplierId}`)).body.lastListDate,
    ).toBe('2026-08-14');
    expect(kit.audited('lists.applied').at(-1)).toMatchObject({
      actor: { kind: 'person', userId: kit.loader.id },
      data: { created: 4, changed: 0, gone: 0, restored: 0, listDate: '2026-08-14' },
    });
    expect(kit.audited('lists.costs').at(-1)?.targets).toHaveLength(4);
    const skipped = (await kit.anomaliesOf()).find(
      (one: { kind: string }) => one.kind === 'price-list-skipped-rows',
    );
    expect(skipped).toMatchObject({
      subject: `price-lists:list:${sent.body.id}`,
      summary: {
        supplier: { id: supplierId, name: 'Bulonera Centro' },
        file: 'lista.xlsx',
        skipped: 1,
        reasons: { 'no-price': 1 },
      },
    });
  });

  it('price-lists-E71, E73, E77, E82 y E88: la siguiente cambia costos, da de baja lo que no vino y cierra lo anterior', async () => {
    const supplierId = await kit.supplier('Aceros Sur');
    const first = await kit.upload(
      sheet('Lista 1/8/2026', [
        ['A1', 'Mecha', 100],
        ['A2', 'Tarugo', 200],
        ['A3', 'Clavo', 300],
        ['A4', 'Sin', 'x'],
      ]),
      { supplierId },
    );
    await apply(first.body.id, { new: 3, changed: 0, gone: 0 });
    const second = await kit.upload(
      sheet('Lista 14/8/2026', [
        ['A1', 'Mecha nueva', 180],
        ['A2', 'Tarugo', 200],
      ]),
      { supplierId },
    );
    expect((await kit.list(second.body.id)).summary).toMatchObject({
      ...{ new: 0, changed: 1, same: 1, gone: 1, skipped: 0, averageChange: 80, review: 1 },
      goneWarning: true,
    });
    await apply(second.body.id, { new: 0, changed: 1, gone: 1 });
    expect(await kit.list(second.body.id)).toMatchObject({
      result: { created: 0, changed: 1, gone: 1, restored: 0 },
    });
    expect(await productOf(supplierId, 'A1')).toMatchObject({
      description: 'Mecha nueva',
      cost: 180_000_000n,
    });
    expect(await productOf(supplierId, 'A3')).toMatchObject({
      cost: null,
      supplierId: null,
      discontinued: true,
    });
    expect(kit.audited('lists.costs').at(-1)).toMatchObject({
      targets: [{ kind: 'product' }, { kind: 'product' }],
      data: {
        listId: second.body.id,
        costs: [
          ['100000000', '180000000'],
          ['300000000', null],
        ],
      },
    });
    const subjects = (await kit.anomaliesOf()).map((one: { subject: string }) => one.subject);
    expect(subjects).not.toContain(`price-lists:list:${first.body.id}`);
    expect(await kit.list(first.body.id)).toMatchObject({ file: false });
    // E76 (en parte): una lista posterior que lo vuelve a traer lo trae de vuelta.
    const third = await kit.upload(
      sheet('Lista 20/8/2026', [
        ['A1', 'Mecha nueva', 180],
        ['A2', 'Tarugo', 200],
        ['A3', 'Clavo', 300],
      ]),
      { supplierId },
    );
    await apply(third.body.id, { new: 0, changed: 0, gone: 0 });
    expect(await kit.list(third.body.id)).toMatchObject({ result: { restored: 1 } });
    expect(await productOf(supplierId, 'A3')).toMatchObject({
      cost: 300_000_000n,
      discontinued: false,
    });
  });

  it('price-lists-E75: una de solo cambios no da de baja nada', async () => {
    const supplierId = await kit.supplier('Corralón Norte');
    const first = await kit.upload(
      sheet('Lista 1/8/2026', [
        ['A1', 'Mecha', 100],
        ['A2', 'Tarugo', 200],
      ]),
      { supplierId },
    );
    await apply(first.body.id, { new: 2, changed: 0, gone: 0 });
    const partial = await kit.upload(sheet('Lista 2/8/2026', [['A1', 'Mecha', 110]]), {
      supplierId,
      scope: 'partial',
    });
    expect((await kit.list(partial.body.id)).summary).toMatchObject({
      changed: 1,
      gone: 0,
      goneWarning: false,
    });
    await apply(partial.body.id, { new: 0, changed: 1, gone: 0 });
    expect(await productOf(supplierId, 'A2')).toMatchObject({ discontinued: false });
  });
});
