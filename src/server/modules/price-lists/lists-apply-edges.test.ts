// Lo que no se aplica y lo que pasa con el lector y la cola (08 · R6.5, R6.9 a R6.11, R5.7, R4.8,
// R4.11): otros números, ya aplicada, más vieja que la última, descartar, el lector automático y
// cancelar mientras se aplica.
import { sql } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

type Rows = (string | number)[][];
const sheet = (title: string, rows: Rows) =>
  xlsx([[title], ['Código', 'Descripción', 'Precio'], ...rows]);

describe('lo que no se aplica, el lector y la cola', () => {
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

  it('price-lists-E62, E65, E66 y R6.5: con otros números, ya aplicada, descartada o más vieja que la última, no se aplica', async () => {
    const supplierId = await kit.supplier('Pinturería Oeste');
    const sent = await kit.upload(sheet('Lista 14/8/2026', [['A1', 'Mecha', 100]]), { supplierId });
    const wrong = await apply(sent.body.id, { new: 2, changed: 0, gone: 0 });
    expect(wrong.status).toBe(409);
    expect(wrong.body).toEqual({
      error: 'numbers-changed',
      numbers: { new: 1, changed: 0, gone: 0 },
    });
    await apply(sent.body.id, { new: 1, changed: 0, gone: 0 });
    expect((await apply(sent.body.id, { new: 1, changed: 0, gone: 0 })).body).toEqual({
      error: 'list-applied',
    });
    const old = await kit.upload(sheet('Lista 1/8/2026', [['A1', 'Mecha', 90]]), { supplierId });
    expect((await kit.list(old.body.id)).summary?.tooOld).toBe(true);
    expect((await apply(old.body.id, { new: 0, changed: 1, gone: 0 })).body).toEqual({
      error: 'list-too-old',
    });
    const discarded = await kit.loader.device.request(
      `/api/price-lists/lists/${old.body.id}/discard`,
      {},
    );
    expect(discarded.body).toMatchObject({ status: 'discarded', reason: 'by-hand' });
    expect(kit.audited('lists.discarded').at(-1)?.data).toEqual({ reason: 'by-hand' });
    for (const path of ['apply', 'discard'])
      expect(
        (
          await kit.loader.device.request(
            `/api/price-lists/lists/${old.body.id}/${path}`,
            path === 'apply' ? { expected: { new: 0, changed: 0, gone: 0 } } : {},
          )
        ).body,
      ).toEqual({ error: 'list-closed' });
    const missing = kit.uuid();
    expect((await apply(missing, { new: 0, changed: 0, gone: 0 })).status).toBe(404);
    expect(
      (await kit.loader.device.request(`/api/price-lists/lists/${missing}/discard`, {})).status,
    ).toBe(404);
  });

  it('price-lists-E44 y E45: el lector automático queda activo al aplicar su lista; con la descartada, se va', async () => {
    const supplierId = await kit.supplier('Sanitarios Este');
    const format = (n: number) =>
      xlsx([
        ['Cód. art.', 'Descripción del artículo', 'Importe'],
        ['Z1', 'Caño', n],
      ]);
    const discarded = await kit.upload(format(10), { supplierId });
    await kit.loader.device.request(`/api/price-lists/lists/${discarded.body.id}/discard`, {});
    const readers = () =>
      sql<{
        supplier_id: string | null;
        pending_list_id: string | null;
        proof_list_id: string | null;
      }>`
      select supplier_id, pending_list_id, proof_list_id from price_lists.readers where origin = 'auto'
        and (supplier_id = ${supplierId} or pending_list_id is not null)`.execute(
        kit.server.platform.db,
      );
    expect((await readers()).rows).toEqual([]);
    const kept = await kit.upload(format(10), { supplierId });
    await apply(kept.body.id, { new: 1, changed: 0, gone: 0 });
    expect((await readers()).rows).toEqual([
      { supplier_id: supplierId, pending_list_id: null, proof_list_id: kept.body.id },
    ]);
    const next = await kit.upload(format(12));
    expect(await kit.list(next.body.id)).toMatchObject({
      supplier: { id: supplierId, from: 'reader' },
    });
    expect((await kit.list(next.body.id)).newReader).toBeUndefined();
  });

  it('price-lists-E86 y E85: cancelada mientras se aplica, no queda nada; la que esperaba en la cola sigue sola', async () => {
    const supplierId = await kit.supplier('Herrería Cinco');
    const rows: Rows = Array.from({ length: 3000 }, (_, i) => [`C${i}`, 'Artículo', 10 + i]);
    const again = await kit.upload(sheet('Lista 1/8/2026', rows), { supplierId });
    // Se aplica y queda «aplicándose» hasta soltarla; mientras, llega otra del mismo proveedor (E85).
    const release = kit.holdApply();
    const started = await kit.loader.device.request(
      `/api/price-lists/lists/${again.body.id}/apply`,
      {
        expected: { new: 3000, changed: 0, gone: 0 },
      },
    );
    expect(started.body).toMatchObject({ status: 'applying' });
    const queued = await kit.loader.device.request(
      `/api/price-lists/lists?name=lista.xlsx&supplierId=${supplierId}`,
      sheet('Lista 2/8/2026', [['Q1', 'Otro', 5]]),
      { 'Content-Type': 'application/octet-stream' },
    );
    expect(await kit.list(queued.body.id)).toMatchObject({ status: 'queued' });
    expect(kit.server.priceLists.cancelApply(again.body.id)).toBe(true);
    release();
    await kit.server.priceLists.idle();
    expect(await kit.list(again.body.id)).toMatchObject({
      status: 'discarded',
      reason: 'replaced',
    });
    expect(await productOf(supplierId, 'C1').catch(() => undefined)).toBeUndefined();
    expect(await kit.list(queued.body.id)).toMatchObject({ status: 'pending' });
    expect(kit.server.priceLists.cancelApply(again.body.id)).toBe(false);
  });
});
