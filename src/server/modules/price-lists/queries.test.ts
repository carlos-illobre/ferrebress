// Cuántas consultas hace cada pedido de las listas de precios (constitución, paso 6; diseño de 08,
// § 3 y § 11): un pedido que empieza a hacer más, por un cambio, falla acá y no en la máquina.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

describe('las consultas de cada pedido', () => {
  let kit: ListsKit;
  let supplierId: string;
  let listId: string;
  beforeAll(async () => {
    kit = await createListsKit();
    supplierId = await kit.supplier('Bulonera Centro');
    const sheet = xlsx([
      ['Código', 'Descripción', 'Precio'],
      ['A1', 'Mecha', 1],
      ['A2', 'Tarugo', 2],
    ]);
    listId = (await kit.upload(sheet, { supplierId })).body.id;
    kit.later(61_000);
    // La primera de cada sesión después de un rato también anota su uso: no se cuenta.
    for (const device of [kit.viewer.device, kit.seller.device])
      await device.request('/api/price-lists/readers');
    await kit.admin.request('/api/price-lists/readers');
  });
  afterAll(() => kit.server.close());

  const count = (run: () => Promise<unknown>) =>
    kit.server.countQueries(async () => {
      await run();
    });
  const viewer = (path: string) => count(() => kit.viewer.device.request(path));

  it('los proveedores: 1, o 2 con «Ver costos» (lo pendiente de cada uno)', async () => {
    expect(await count(() => kit.seller.device.request('/api/price-lists/suppliers'))).toBe(1);
    expect(await viewer('/api/price-lists/suppliers')).toBe(2);
    expect(await count(() => kit.admin.request('/api/price-lists/suppliers/inactive'))).toBe(1);
  });

  it('un proveedor: 1, o 3 con «Ver costos» (sus listas y los nombres); sus listas, 3; sus artículos, 2', async () => {
    const base = `/api/price-lists/suppliers/${supplierId}`;
    expect(await count(() => kit.seller.device.request(base))).toBe(1);
    expect(await viewer(base)).toBe(3);
    expect(await viewer(`${base}/lists`)).toBe(3);
    expect(await viewer(`${base}/items`)).toBe(2);
  });

  it('price-lists-E39: una lista en espera, 4 (la lista, su proveedor, el resumen y quién la subió); una página del detalle, 2', async () => {
    expect(await viewer(`/api/price-lists/lists/${listId}`)).toBe(4);
    expect(await viewer(`/api/price-lists/lists/${listId}/rows`)).toBe(2);
  });

  it('lectores, archivos y anomalías: 1, 2 y 1', async () => {
    expect(await viewer('/api/price-lists/readers')).toBe(1);
    expect(await viewer('/api/price-lists/files')).toBe(2);
    expect(await count(() => kit.admin.request('/api/anomalies'))).toBe(1);
  });
});
