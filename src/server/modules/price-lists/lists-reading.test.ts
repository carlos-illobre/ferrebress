// La lectura de las listas (diseño de 08, § 6 y § 8): el avance por el canal, el proceso que se
// cuelga, lo que se retoma al arrancar y volver a leer cuando llega un lector que la entiende.
import { sql } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { listen, settle } from '../../testing/device-link.ts';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

// Un formato que no tiene encabezado: solo lo entiende un lector de un programador.
const formatA = xlsx([['FORMATO A'], ['A1', 'Mecha', 100], ['A2', 'Tarugo', 200]]);
const programmer = (body = '') => `globalThis.reader = {
  recognizes: (head) => head[0].rows[0]?.[0]?.t === 'FORMATO A' ? 'yes' : 'no',
  read(block) { ${body} return block.rows.map((row, i) => {
    const r = block.start + i;
    return r === 0 ? { row: r, kind: 'title' } : { row: r, kind: 'product', at: { code: [r, 0], description: [r, 1], price: [r, 2] } };
  }); },
};`;

describe('la lectura de las listas', () => {
  let kit: ListsKit;
  beforeAll(async () => {
    kit = await createListsKit({ stallMs: 1500 });
  });
  afterAll(() => kit.server.close());
  beforeEach(() => kit.later(61_000));

  it('price-lists-E39 y E08: el avance llega por el canal, a quien tiene «Ver costos»', async () => {
    await kit.setting('confirmRows', 1000);
    const rows = [
      ['Código', 'Descripción', 'Precio'],
      ...Array.from({ length: 1200 }, (_, i) => [`C${i}`, 'x', 1]),
    ];
    const sent = await kit.upload(xlsx(rows), {
      supplierId: await kit.supplier('Bulonera Centro'),
    });
    const tab = await listen(kit.server, kit.viewer.device, `price-lists.list:${sent.body.id}`);
    expect(tab.last('price-lists.list')).toEqual({
      status: 'reading',
      waitingFor: 'size',
      rowsRead: 0,
      rowsTotal: 1201,
    });
    await kit.loader.device.request(`/api/price-lists/lists/${sent.body.id}/size`, {});
    await kit.server.priceLists.idle();
    await settle();
    expect(tab.last('price-lists.list')).toEqual({
      status: 'pending',
      rowsRead: 1201,
      rowsTotal: 1201,
    });
    await tab.close();
    const refused = await listen(kit.server, kit.seller.device, `price-lists.list:${sent.body.id}`);
    expect(refused.status).toBe(403);
    expect(kit.audited('permission.denied').at(-1)?.data).toMatchObject({
      permission: 'price-lists.costs',
      topic: 'price-lists.list',
    });
    await refused.close();
    await kit.setting('confirmRows', 200_000);
  });

  it('price-lists-E47: no se pudo leer, y cuando llega un lector que la entiende se lee sola y la anomalía se cierra', async () => {
    const supplierId = await kit.supplier('Aceros Sur');
    const sent = await kit.upload(formatA, { supplierId });
    expect(await kit.list(sent.body.id)).toMatchObject({
      status: 'unreadable',
      reason: 'no-reader',
    });
    const subject = `price-lists:list:${sent.body.id}`;
    expect((await kit.anomaliesOf()).map((one: { subject: string }) => one.subject)).toContain(
      subject,
    );
    kit.addReader('formato-a.js', programmer());
    await kit.server.priceLists.resume();
    await kit.server.priceLists.idle();
    expect(await kit.list(sent.body.id)).toMatchObject({
      status: 'pending',
      supplier: { id: supplierId },
    });
    expect((await kit.anomaliesOf()).map((one: { subject: string }) => one.subject)).not.toContain(
      subject,
    );
  });

  it('price-lists-E53: un proceso que se cuelga se reemplaza y la lista se intenta otra vez; a la segunda, no se pudo leer', async () => {
    kit.addReader('formato-a.js', programmer('for (;;) {}'));
    await kit.server.priceLists.resume();
    const sent = await kit.upload(formatA, { supplierId: await kit.supplier('Corralón Norte') });
    expect(await kit.list(sent.body.id)).toMatchObject({ status: 'unreadable', reason: 'crashed' });
    kit.addReader('formato-a.js', programmer());
    await kit.server.priceLists.resume();
    await kit.server.priceLists.idle();
  });

  it('al arrancar: la que se leía se retoma, la de dos intentos queda sin leer y la que se aplicaba vuelve a esperar', async () => {
    const supplierId = await kit.supplier('Pinturería Oeste');
    const [cut, twice, applying] = [
      await kit.upload(formatA, { supplierId }),
      await kit.upload(formatA),
      await kit.upload(formatA, { supplierId: await kit.supplier('Sanitarios Este') }),
    ];
    const db = kit.server.platform.db;
    await sql`update price_lists.lists set status = 'reading', read_at = null, attempts = 1 where id = ${cut.body.id}`.execute(
      db,
    );
    await sql`update price_lists.lists set status = 'reading', read_at = null, waiting_for = null, attempts = 2 where id = ${twice.body.id}`.execute(
      db,
    );
    await sql`update price_lists.lists set status = 'applying' where id = ${applying.body.id}`.execute(
      db,
    );
    await kit.server.priceLists.resume();
    await kit.server.priceLists.idle();
    expect(await kit.list(cut.body.id)).toMatchObject({ status: 'pending' });
    expect(await kit.list(twice.body.id)).toMatchObject({
      status: 'unreadable',
      reason: 'crashed',
    });
    expect(await kit.list(applying.body.id)).toMatchObject({
      status: 'pending',
      reason: 'interrupted',
    });
  });
});
