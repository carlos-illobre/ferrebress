// Cuántas consultas hace cada pedido del catálogo (constitución, paso 6; diseño de 07, § 3): buscar sale
// del índice y la página, de una consulta por clave; un pedido que empieza a hacer más falla acá.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type CatalogKit, createCatalogKit } from '../../testing/catalog/catalog-kit.ts';

describe('las consultas de cada pedido del catálogo', () => {
  let kit: CatalogKit;
  let id: string;
  beforeAll(async () => {
    kit = await createCatalogKit();
    const supplierId = await kit.supplier('Ferretería Norte');
    await kit.applyList(supplierId, [
      ['C1', 'Clavo', 100],
      ['C2', 'Cuerda', 100],
    ]);
    id = await kit.idOf(supplierId, 'C1');
    // La primera de cada sesión después de un rato también anota su uso: no se cuenta.
    for (const device of [kit.admin, kit.seller.device, kit.margins.device])
      await device.request('/api/catalog/brands');
  });
  afterAll(() => kit.server.close());

  const count = (run: () => Promise<unknown>) =>
    kit.server.countQueries(async () => {
      await run();
    });

  it('buscar: 1 (la página); las marcas: 0; los dados de baja: 1', async () => {
    expect(await count(() => kit.search({ q: 'clavo' }))).toBe(1);
    expect(await count(() => kit.search())).toBe(1);
    expect(await count(() => kit.admin.request('/api/catalog/brands'))).toBe(0);
    expect(await count(() => kit.search({ show: 'discontinued' }))).toBe(1);
  });

  it('un producto: 1, o 2 con «Ver costos» (de dónde sale su costo)', async () => {
    expect(await count(() => kit.product(id, kit.seller.device))).toBe(1);
    expect(await count(() => kit.product(id))).toBe(2);
  });

  it('un cambio de margen: 4 dentro de la transacción (el paso, la espera, el producto y guardar)', async () => {
    // Abrir y confirmar la transacción son 2 más, y la búsqueda lo lee al confirmar, 1 más.
    expect(await count(() => kit.setMargin(id, null, 50))).toBe(7);
  });
});
