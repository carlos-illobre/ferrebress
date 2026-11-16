// Subir una lista y leerla, de punta a punta en el servidor (08 · R4; diseño de 08, § 3): el archivo
// va al almacén, un proceso lector la lee y la lista queda en espera con sus costos.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

const plain = (title = 'Lista de precios — 14/8/2026') =>
  xlsx([
    [title],
    ['Código', 'Descripción', 'Precio'],
    ['BREMEN'],
    ['B1', 'Mecha 6', 1000],
    ['B2', 'Mecha 8', 'a consultar'],
  ]);

describe('subir una lista', () => {
  let kit: ListsKit;
  beforeAll(async () => {
    kit = await createListsKit();
  });
  afterAll(() => kit.server.close());
  // El límite de subidas es por minuto: cada prueba empieza en otro.
  beforeEach(() => kit.later(61_000));

  it('price-lists-E32, E35 y E42: desde la pantalla de un proveedor, se lee sola y queda en espera con sus costos', async () => {
    const supplierId = await kit.supplier('Bulonera Centro');
    const sent = await kit.upload(plain(), { supplierId });
    expect(sent.status).toBe(201);
    expect(sent.body).toMatchObject({
      status: 'reading',
      fileName: 'lista.xlsx',
      scope: 'full',
      file: true,
    });
    const list = await kit.list(sent.body.id);
    expect(list).toMatchObject({
      status: 'pending',
      rowsRead: 5,
      rowsTotal: 5,
      supplier: { id: supplierId, name: 'Bulonera Centro', from: 'screen', confirmed: true },
      listDate: '2026-08-14',
      dateFrom: 'sheet',
      newReader: true,
    });
    expect(list.waitingFor).toBeUndefined();
    expect(await kit.rows(sent.body.id)).toEqual([
      { code: 'B1', cost: '1000000000', change: 'new', skipped: null },
      { code: 'B2', cost: null, change: null, skipped: 'not-a-number' },
    ]);
    expect(kit.audited('lists.uploaded').at(-1)).toMatchObject({
      targets: [{ kind: 'list', id: sent.body.id, name: 'lista.xlsx' }],
      data: { scope: 'full', supplierId },
    });
  });

  it('price-lists-E36 y E84: sin fecha, o con una que no se toma, la de hoy', async () => {
    const supplierId = await kit.supplier('Aceros Sur');
    const none = await kit.upload(plain('Lista de precios'), { supplierId });
    expect(await kit.list(none.body.id)).toMatchObject({
      dateFrom: 'server',
      listDate: expect.stringMatching(/^2026-1[01]-/),
    });
    const odd = await kit.upload(plain('LISTA 14/8/2062'), { supplierId });
    expect(await kit.list(odd.body.id)).toMatchObject({ dateFrom: 'server-ignored' });
  });

  it('price-lists-E38 y E31d: otra lista del mismo proveedor reemplaza la que esperaba', async () => {
    const supplierId = await kit.supplier('Corralón Norte');
    const first = await kit.upload(plain(), { supplierId });
    const second = await kit.upload(plain(), { supplierId });
    expect(await kit.list(first.body.id)).toMatchObject({
      status: 'discarded',
      reason: 'replaced',
    });
    expect(await kit.list(second.body.id)).toMatchObject({ status: 'pending' });
    expect(await kit.rows(first.body.id)).toEqual([]);
  });

  it('price-lists-E33 y E34: otro formato o más grande que el máximo no se guarda', async () => {
    const pdf = await kit.upload(Buffer.from('%PDF-1.4'), { name: 'lista.pdf' });
    expect(pdf.status).toBe(415);
    expect(pdf.body).toEqual({ error: 'file-format', formats: ['.xlsx', '.xls', '.csv'] });
    const zipAsCsv = await kit.upload(plain(), { name: 'lista.csv' });
    expect(zipAsCsv.body.error).toBe('file-format');
    const program = await kit.upload(Buffer.from('MZ ejecutable'), { name: 'lista.xls' });
    expect(program.body.error).toBe('file-format');
    await kit.setting('maxFileMb', 1);
    const big = await kit.upload(Buffer.alloc(2 ** 20 + 1, 0x41), { name: 'lista.csv' });
    expect(big.status).toBe(413);
    expect(big.body).toEqual({ error: 'file-too-large', maxMb: 1 });
    await kit.setting('maxFileMb', 30);
    expect(await kit.server.platform.files.list()).not.toContain(expect.stringMatching(/^4141/));
  });

  it('price-lists-E37: un archivo dañado queda «No se pudo leer», con su archivo y una anomalía', async () => {
    const broken = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x72, 0x6f, 0x74, 0x6f]);
    const sent = await kit.upload(broken);
    expect(await kit.list(sent.body.id)).toMatchObject({
      status: 'unreadable',
      reason: 'too-big',
      file: true,
    });
    expect(await kit.anomaliesOf()).toContainEqual(
      expect.objectContaining({
        kind: 'price-list-unreadable',
        subject: `price-lists:list:${sent.body.id}`,
        summary: { file: 'lista.xlsx', reason: 'too-big' },
      }),
    );
  });

  it('price-lists-E46: con dos columnas de precio no se lee, y la anomalía dice el motivo y el proveedor', async () => {
    const supplierId = await kit.supplier('Pinturería Oeste');
    const two = xlsx([
      ['Código', 'Descripción', 'Precio s/IVA', 'Precio c/IVA'],
      ['A', 'B', 1, 2],
    ]);
    const sent = await kit.upload(two, { supplierId });
    expect(await kit.list(sent.body.id)).toMatchObject({
      status: 'unreadable',
      reason: 'auto-unsure',
    });
    const anomaly = (await kit.anomaliesOf()).find((one: { subject: string }) =>
      one.subject.endsWith(sent.body.id),
    );
    expect(anomaly.summary).toEqual({
      file: 'lista.xlsx',
      reason: 'auto-unsure',
      supplier: { id: supplierId, name: 'Pinturería Oeste' },
    });
  });

  it('price-lists-E04 y E05: sin «Cargar listas» no se sube; sin «Ver costos» no se ve; una que no existe, 404', async () => {
    const refused = await kit.upload(plain(), {}, kit.viewer.device);
    expect(refused.body).toMatchObject({ error: 'forbidden', permission: 'price-lists.load' });
    const sent = await kit.upload(plain());
    expect((await kit.seller.device.request(`/api/price-lists/lists/${sent.body.id}`)).status).toBe(
      403,
    );
    expect((await kit.admin.request(`/api/price-lists/lists/${kit.uuid()}`)).status).toBe(404);
    expect((await kit.upload(plain(), { supplierId: kit.uuid() })).status).toBe(404);
    const odd = await kit.loader.device.request('/api/price-lists/lists?nombre=x', plain(), {
      'Content-Type': 'application/octet-stream',
    });
    expect(odd.status).toBe(400);
  });
});
