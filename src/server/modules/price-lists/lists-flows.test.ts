// Más caminos de una lista (08 · R4.2, R4.8, R9.2): subir por partes, la cola detrás de una que se
// aplica, una deducida que resulta más vieja que otra del mismo proveedor y las anomalías de las que
// no se pudieron leer, que se cierran con una que sí.
import type { ListSummary } from '@ferrebress/shared/contracts/price-lists';
import { numbersOf } from '@ferrebress/shared/contracts/price-lists-review';
import { sql } from 'kysely';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { listen, settle } from '../../testing/device-link.ts';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';
import { priceListsSettings } from './settings.ts';

const plain = xlsx([
  ['Código', 'Descripción', 'Precio'],
  ['A1', 'Mecha', 100],
]);
const named = (title: string) =>
  xlsx([[title], ['Artículo', 'Detalle', 'Lista'], ['X1', 'Pala', 500]]);
const twoPrices = xlsx([
  ['Código', 'Descripción', 'Precio s/IVA', 'Precio c/IVA'],
  ['A', 'B', 1, 2],
]);

describe('más caminos de una lista', () => {
  let kit: ListsKit;
  const idle = priceListsSettings.uploadIdleMs;
  beforeAll(async () => {
    kit = await createListsKit();
  });
  afterAll(() => kit.server.close());
  beforeEach(() => kit.later(61_000));
  afterEach(() => {
    priceListsSettings.uploadIdleMs = idle;
  });

  it('price-lists-E34: subida por partes, se corta al pasar el máximo; sin datos por un rato, también', async () => {
    await kit.setting('maxFileMb', 1);
    async function* big() {
      for (let i = 0; i < 3; i++) yield new Uint8Array(600_000).fill(0x41);
    }
    expect(await kit.uploadStream(big())).toEqual({
      status: 413,
      body: { error: 'file-too-large', maxMb: 1 },
    });
    await kit.setting('maxFileMb', 30);
    priceListsSettings.uploadIdleMs = 50;
    async function* stalls() {
      yield new TextEncoder().encode('Código;Precio\n');
      await new Promise((resolve) => setTimeout(resolve, 300));
      yield new TextEncoder().encode('A;1\n');
    }
    expect((await kit.uploadStream(stalls())).status).toBe(400);
    async function* small() {
      yield new TextEncoder().encode('Código,Descripción,Precio\nA1,Mecha,100\n');
    }
    const sent = await kit.uploadStream(small());
    expect(sent.status).toBe(201);
    await kit.server.priceLists.idle();
  });

  it('price-lists-E85: con una lista del proveedor aplicándose, la nueva espera en la cola', async () => {
    const supplierId = await kit.supplier('Bulonera Centro');
    const first = await kit.upload(plain, { supplierId });
    const release = kit.holdApply();
    const summary = (await kit.list(first.body.id)).summary as ListSummary;
    await kit.loader.device.request(`/api/price-lists/lists/${first.body.id}/apply`, {
      expected: numbersOf(summary),
    });
    const second = await kit.loader.device.request(
      `/api/price-lists/lists?name=lista.xlsx&supplierId=${supplierId}`,
      plain,
      { 'Content-Type': 'application/octet-stream' },
    );
    expect(await kit.list(second.body.id)).toMatchObject({ status: 'queued', rowsRead: 0 });
    const cancelled = await kit.loader.device.request(
      `/api/price-lists/lists/${second.body.id}/cancel`,
      {},
    );
    expect(cancelled.body).toMatchObject({ status: 'discarded', reason: 'cancelled' });
    release();
    await kit.server.priceLists.idle();
    expect(await kit.list(first.body.id)).toMatchObject({ status: 'applied' });
  });

  it('price-lists-R4.8: elegir el proveedor de una lista más vieja que la que ya espera la descarta', async () => {
    const supplierId = await kit.supplier('Aceros Sur');
    const older = await kit.upload(named('Lista de precios'));
    const newer = await kit.upload(plain, { supplierId });
    const chosen = await kit.loader.device.request(
      `/api/price-lists/lists/${older.body.id}/supplier`,
      { supplierId },
    );
    expect(chosen.body).toMatchObject({ status: 'discarded', reason: 'replaced' });
    expect(await kit.list(newer.body.id)).toMatchObject({ status: 'pending' });
  });

  it('price-lists-R9.2: la anomalía de una que no se pudo leer se cierra cuando el proveedor sube otra que sí', async () => {
    const supplierId = await kit.supplier('Corralón Norte');
    const bad = await kit.upload(twoPrices, { supplierId });
    const subject = `price-lists:list:${bad.body.id}`;
    expect((await kit.anomaliesOf()).map((one: { subject: string }) => one.subject)).toContain(
      subject,
    );
    await kit.upload(plain, { supplierId });
    expect((await kit.anomaliesOf()).map((one: { subject: string }) => one.subject)).not.toContain(
      subject,
    );
  });

  it('el avance de una lista que no existe no llega; sin el permiso, deja de llegar', async () => {
    const quiet = await listen(kit.server, kit.viewer.device, `price-lists.list:${kit.uuid()}`);
    expect(quiet.received.filter((one) => one.event === 'price-lists.list')).toEqual([]);
    await quiet.close();
    const sent = await kit.upload(plain, { supplierId: await kit.supplier('Pinturería Oeste') });
    const tab = await listen(kit.server, kit.viewer.device, `price-lists.list:${sent.body.id}`);
    expect(tab.last('price-lists.list')).toMatchObject({ status: 'pending' });
    await kit.reconfirm();
    await kit.setRoles(kit.viewer.id, [await kit.role('Sin costos', ['users.view'])]);
    await settle();
    await tab.close();
  });

  it('dos listas del mismo proveedor subidas en el mismo instante: queda una sola en espera', async () => {
    const supplierId = await kit.supplier('Sanitarios Este');
    const send = () =>
      kit.loader.device.request(
        `/api/price-lists/lists?name=lista.xlsx&supplierId=${supplierId}`,
        plain,
        {
          'Content-Type': 'application/octet-stream',
        },
      );
    const [one, two] = [await send(), await send()];
    await kit.server.priceLists.idle();
    const states = [(await kit.list(one.body.id)).status, (await kit.list(two.body.id)).status];
    expect(states.sort()).toEqual(['discarded', 'pending']);
  });

  it('un bloque sin ningún producto no cambia nada', async () => {
    const rows = [
      ['Código', 'Descripción', 'Precio'],
      ...Array.from({ length: 4999 }, (_, i) => [`C${i}`, 'Mecha', 1]),
      ['Z1', 'Tarugo', 'consultar'],
    ];
    const sent = await kit.upload(xlsx(rows), { supplierId: await kit.supplier('Vidriería Dos') });
    expect(await kit.list(sent.body.id)).toMatchObject({ status: 'pending', rowsRead: 5001 });
    expect((await kit.rows(sent.body.id)).at(-1)).toMatchObject({
      code: 'Z1',
      skipped: 'not-a-number',
    });
  });

  it('el largo que dice el pedido ya alcanza para rechazarla, sin leerla', async () => {
    await kit.setting('maxFileMb', 1);
    const sent = await kit.loader.device.request(
      '/api/price-lists/lists?name=lista.csv',
      new Uint8Array(10),
      {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(2 ** 21),
      },
    );
    expect(sent.status).toBe(413);
    await kit.setting('maxFileMb', 30);
  });

  it('volver a leer una lista que ya no se lee no hace nada', async () => {
    const sent = await kit.upload(plain, { supplierId: await kit.supplier('Electricidad Tres') });
    await kit.loader.device.request(`/api/price-lists/lists/${sent.body.id}/scope`, {
      scope: 'partial',
    });
    await kit.server.priceLists.read(sent.body.id);
    expect(await kit.list(sent.body.id)).toMatchObject({ status: 'pending', scope: 'partial' });
  });

  it('price-lists-E63: una fila que trae el mismo costo que su artículo queda igual; otra, cambia', async () => {
    const supplierId = await kit.supplier('Herrería Cinco');
    await kit.articles(supplierId, [
      { code: 'A1', listPrice: 100_000_000n },
      { code: 'A2', listPrice: 50_000_000n },
    ]);
    const both = xlsx([
      ['Código', 'Descripción', 'Precio'],
      ['A1', 'Mecha', 100],
      ['A2', 'Tarugo', 60],
    ]);
    const sent = await kit.upload(both, { supplierId });
    expect((await kit.rows(sent.body.id)).map((row) => row.change)).toEqual(['same', 'changed']);
  });
});
