// Escenarios de las listas que se prueban de punta a punta del servidor (08 · E27, E31c, E64, E70,
// E83, E87): el IVA de arranque, dos listas a la vez, dos personas que aplican a la vez, el mismo código
// en dos proveedores, una descartada con salteadas y una subida que se corta.
import { sql } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

type Rows = (string | number)[][];
const sheet = (rows: Rows, title = 'Lista') =>
  xlsx([[title], ['Código', 'Descripción', 'Precio'], ...rows]);

describe('escenarios de las listas', () => {
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
    return (await kit.products([found.rows[0]?.product_id as string]))[0];
  };

  it('price-lists-E27: una lista sin IVA deja los productos nuevos con el IVA de arranque del proveedor', async () => {
    const supplierId = await kit.supplier('Corralón Sur');
    const terms = { vatIncluded: false, discounts: [], defaultVat: 105, onChange: 'recalculate' };
    await kit.admin.request(`/api/price-lists/suppliers/${supplierId}/terms`, {
      terms,
      version: 1,
    });
    const sent = await kit.upload(sheet([['C1', 'Chapa', 100]]), { supplierId });
    await apply(sent.body.id, { new: 1, changed: 0, gone: 0 });
    expect(await productOf(supplierId, 'C1')).toMatchObject({ vat: 105 });
  });

  it('price-lists-E15: con una lista aplicándose, el proveedor no se da de baja ni cambia cómo cobra', async () => {
    const supplierId = await kit.supplier('Corralón Ocupado');
    const sent = await kit.upload(sheet([['O1', 'Ocupado', 10]]), { supplierId });
    const release = kit.holdApply();
    await kit.loader.device.request(`/api/price-lists/lists/${sent.body.id}/apply`, {
      expected: { new: 1, changed: 0, gone: 0 },
    });
    const base = `/api/price-lists/suppliers/${supplierId}`;
    expect((await kit.admin.request(`${base}/deactivate`, {})).body).toEqual({
      error: 'list-applying',
    });
    const terms = { vatIncluded: true, discounts: [], defaultVat: 210, onChange: 'recalculate' };
    expect((await kit.admin.request(`${base}/terms`, { terms, version: 1 })).body).toEqual({
      error: 'list-applying',
    });
    release();
    await kit.server.priceLists.idle();
    expect(await kit.list(sent.body.id)).toMatchObject({ status: 'applied' });
  });

  it('price-lists-E70: el mismo código en dos proveedores son dos productos', async () => {
    const [one, two] = [await kit.supplier('Bulonera Uno'), await kit.supplier('Bulonera Dos')];
    for (const supplierId of [one, two]) {
      const sent = await kit.upload(sheet([['100', `Artículo de ${supplierId}`, 10]]), {
        supplierId,
      });
      await apply(sent.body.id, { new: 1, changed: 0, gone: 0 });
    }
    const [a, b] = [await productOf(one, '100'), await productOf(two, '100')];
    expect(a?.id).toBeDefined();
    expect(a?.id).not.toBe(b?.id);
  });

  it('price-lists-E64: dos personas aplican a la vez: se aplica una sola vez, la otra ve que ya se aplica', async () => {
    const supplierId = await kit.supplier('Ferretera Doble');
    const sent = await kit.upload(sheet([['D1', 'Disco', 30]]), { supplierId });
    const expected = { new: 1, changed: 0, gone: 0 };
    const path = `/api/price-lists/lists/${sent.body.id}/apply`;
    const answers = await Promise.all([
      kit.loader.device.request(path, { expected }),
      kit.admin.request(path, { expected }),
    ]);
    await kit.server.priceLists.idle();
    expect(answers.map((one) => one.status).sort()).toEqual([202, 409]);
    expect(answers.find((one) => one.status === 409)?.body.error).toMatch(/^list-appl/);
    expect(
      kit.audited('lists.applied').filter((one) => one.targets?.[0]?.id === sent.body.id),
    ).toHaveLength(1);
  });

  it('price-lists-E31c: dos listas de proveedores distintos se leen a la vez, cada una con su avance', async () => {
    const [one, two] = [await kit.supplier('Aceros Litoral'), await kit.supplier('Bulonera Norte')];
    const big = (code: string) =>
      sheet(Array.from({ length: 6000 }, (_, i) => [`${code}${i}`, 'x', 1]));
    const send = (file: Uint8Array, supplierId: string) =>
      kit.loader.device.request(
        `/api/price-lists/lists?name=l.xlsx&supplierId=${supplierId}`,
        file,
        {
          'Content-Type': 'application/octet-stream',
        },
      );
    const [a, b] = await Promise.all([send(big('A'), one), send(big('B'), two)]);
    // Las dos se leen: ninguna espera que termine la otra.
    const reading = await sql<{ status: string }>`select status from price_lists.lists
      where id in (${a.body.id}, ${b.body.id})`.execute(kit.server.platform.db);
    expect(reading.rows.map((row) => row.status)).toEqual(['reading', 'reading']);
    await kit.server.priceLists.idle();
    for (const id of [a.body.id, b.body.id])
      expect(await kit.list(id)).toMatchObject({ status: 'pending', rowsRead: 6002 });
  });

  it('price-lists-E83: una lista con salteadas que se descarta no deja anomalía', async () => {
    const supplierId = await kit.supplier('Pinturas Descarte');
    const sent = await kit.upload(
      sheet([
        ['P1', 'Pintura', 10],
        ['P2', 'Sin precio', 'a consultar'],
      ]),
      {
        supplierId,
      },
    );
    expect((await kit.list(sent.body.id)).summary?.skipped).toBe(1);
    await kit.loader.device.request(`/api/price-lists/lists/${sent.body.id}/discard`, {});
    const anomalies: { summary: { supplier?: { name: string } } }[] = await kit.anomaliesOf();
    expect(anomalies.filter((one) => one.summary.supplier?.name === 'Pinturas Descarte')).toEqual(
      [],
    );
  });

  it('price-lists-E87: una subida que se corta antes de terminar no deja ni la lista ni el archivo', async () => {
    const files = await kit.server.platform.files.list(-1);
    const before = await sql<{
      n: number;
    }>`select count(*)::int as n from price_lists.lists`.execute(kit.server.platform.db);
    async function* cut() {
      yield new TextEncoder().encode('Código,Descripción,Precio\nA1,Mecha,100\n');
      throw new Error('quien subía cerró la pestaña');
    }
    expect((await kit.uploadStream(cut())).status).toBe(400);
    expect(await kit.server.platform.files.list(-1)).toEqual(files);
    const after = await sql<{
      n: number;
    }>`select count(*)::int as n from price_lists.lists`.execute(kit.server.platform.db);
    expect(after.rows[0]?.n).toBe(before.rows[0]?.n);
  });
});
