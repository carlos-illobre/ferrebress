// Cambiar un producto (07 · R1.4, R1.5, R2.7, R4, R5): la unidad, el margen y el IVA, el choque entre
// dos personas, lo que no vale, los permisos, Quién hizo qué y una lista que se está aplicando.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type CatalogKit, createCatalogKit } from '../../testing/catalog/catalog-kit.ts';

describe('cambiar un producto', () => {
  let kit: CatalogKit;
  let supplierId: string;
  let id: string;
  beforeAll(async () => {
    kit = await createCatalogKit();
    supplierId = await kit.supplier('Ferretería Norte');
    await kit.applyList(supplierId, [['M1', 'Martillo', 1500, 21]]);
    id = await kit.idOf(supplierId, 'M1');
  });
  afterAll(() => kit.server.close());

  it('catalog-E02: con «Cambiar los datos de un producto», la unidad se guarda y se deshace', async () => {
    expect((await kit.setUnit(id, 'un.', 'kg')).body).toMatchObject({ unit: 'kg' });
    expect((await kit.setUnit(id, 'kg', 'un.')).body).toMatchObject({ unit: 'un.' });
    // El mismo valor no cambia nada ni se anota.
    const before = kit.audited('products.unit-changed').length;
    expect((await kit.setUnit(id, 'un.', 'un.')).status).toBe(200);
    expect(kit.audited('products.unit-changed')).toHaveLength(before);
  });

  it('catalog-E04: dos personas a la vez: la segunda no pisa a la primera y ve el valor de ahora', async () => {
    await kit.setMargin(id, null, 50);
    expect((await kit.setMargin(id, 50, 80)).status).toBe(200);
    const second = await kit.setMargin(id, 50, 60, kit.admin);
    expect(second).toMatchObject({
      status: 409,
      body: { error: 'product-changed', product: { margin: 80 } },
    });
    expect((await kit.product(id)).margin).toBe(80);
  });

  it('catalog-E09: un margen de 0, 10.001 o con coma no se guarda', async () => {
    for (const value of [0, 10_001, 12.5])
      expect((await kit.setMargin(id, 80, value)).status).toBe(400);
    expect((await kit.product(id)).margin).toBe(80);
  });

  it('catalog-E20, R2.7: el margen va a Quién hizo qué con el de antes, el de después y el precio', async () => {
    expect((await kit.setMargin(id, 80, 100)).body).toMatchObject({ sale: '400000' });
    expect(kit.audited('products.margin-changed').at(-1)).toMatchObject({
      targets: [{ kind: 'product', id, name: 'Martillo' }],
      changes: { margin: { before: 80, after: 100 } },
    });
    // El precio no cambió: no se anota.
    expect(kit.audited('products.margin-changed').at(-1)?.changes).not.toHaveProperty('price');
    // Sacar el margen: sin precio.
    expect((await kit.setMargin(id, 100, null)).body).toMatchObject({ state: 'no-price' });
    expect(kit.audited('products.margin-changed').at(-1)).toMatchObject({
      changes: { price: { before: '400000', after: null } },
    });
    expect((await kit.search({ show: 'noPrice' })).products).toContainEqual(
      expect.objectContaining({ id }),
    );
  });

  it('catalog-E19: sin el permiso, no cambia nada y queda el rechazo', async () => {
    expect(await kit.setMargin(id, null, 50, kit.editor.device)).toMatchObject({
      status: 403,
      body: { error: 'forbidden', permission: 'catalog.margins' },
    });
    expect((await kit.setUnit(id, 'un.', 'kg', kit.margins.device)).status).toBe(403);
    expect((await kit.product(id)).margin).toBeNull();
    expect(kit.audited('permission.denied').at(-1)).toMatchObject({
      data: { permission: 'catalog.products' },
    });
  });

  it('catalog-E18: «Cambiar márgenes» incluye «Ver costos»', async () => {
    const one = await kit.product(id, kit.margins.device);
    expect(one).toHaveProperty('cost', '1500000000');
    const { permissions } = await import('@ferrebress/shared/contracts/permissions');
    expect(permissions.find((one) => one.id === 'catalog.margins')?.includes).toEqual([
      'price-lists.costs',
    ]);
  });

  it('el IVA, con su texto en Quién hizo qué', async () => {
    expect((await kit.setVat(id, { before: 210, value: 105 })).body).toMatchObject({
      vat: 105,
      vatManual: true,
    });
    expect(kit.audited('products.vat-changed').at(-1)).toMatchObject({
      changes: { vat: { before: 210, after: 105 } },
    });
  });

  it('catalog-R1.6: un producto dado de baja también se cambia, y sigue fuera de la búsqueda', async () => {
    const lone = await kit.supplier('Proveedor Solo');
    await kit.applyList(lone, [
      ['D1', 'Desarmador', 100],
      ['D2', 'Destornillador', 100],
    ]);
    await kit.applyList(lone, [['D2', 'Destornillador', 100]]);
    const gone = await kit.idOf(lone, 'D1');
    expect((await kit.setMargin(gone, null, 40)).body).toMatchObject({ margin: 40 });
    expect((await kit.search({ q: 'desarmador' })).products).toEqual([]);
  });

  it('un producto que no existe: 404', async () => {
    const nobody = '0190a000-0000-7000-8000-000000000000';
    expect((await kit.setUnit(nobody, 'un.', 'kg')).status).toBe(404);
    expect((await kit.setUnit('nada', 'un.', 'kg')).status).toBe(404);
  });

  it('catalog-R1.5: si una lista de su proveedor tiene trabado el producto más de 5 s, 409', async () => {
    const { orListApplying } = await import('./routes/changes.ts');
    expect(await orListApplying(Promise.reject({ code: '55P03' }))).toEqual({
      refused: 'list-applying',
    });
    await expect(orListApplying(Promise.reject(new Error('otra cosa')))).rejects.toThrow(
      'otra cosa',
    );
  });
});
