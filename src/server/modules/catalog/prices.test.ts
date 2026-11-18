// El producto y su precio (07 · R1, R2; 08 · E28, E72, E76, E95), con listas de verdad: un producto
// nuevo, el margen, el precio que cambia solo y lo cambiado a mano que ninguna lista pisa.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type CatalogKit, createCatalogKit } from '../../testing/catalog/catalog-kit.ts';

describe('el producto y su precio', () => {
  let kit: CatalogKit;
  let supplierId: string;
  beforeAll(async () => {
    kit = await createCatalogKit();
    supplierId = await kit.supplier('Ferretería Norte');
  });
  afterAll(() => kit.server.close());

  it('catalog-E01: un producto nuevo de una lista es «un.», con el IVA de su lista y «sin precio»', async () => {
    await kit.applyList(supplierId, [['N1', 'Tornillo nuevo', 1500, 10.5]], 'partial');
    const id = await kit.idOf(supplierId, 'N1');
    expect(await kit.product(id)).toMatchObject({
      code: 'N1',
      unit: 'un.',
      vat: 105,
      state: 'no-price',
      margin: null,
      cost: '1500000000',
      supplier: { id: supplierId, name: 'Ferretería Norte' },
    });
    expect((await kit.product(id)).sale).toBeUndefined();
  });

  it('catalog-E06, E10: con margen tiene precio, y si una lista cambia el costo, cambia solo', async () => {
    await kit.applyList(supplierId, [['P1', 'Martillo', 1500, 21]], 'partial');
    const id = await kit.idOf(supplierId, 'P1');
    const saved = await kit.setMargin(id, null, 100);
    expect(saved).toMatchObject({
      status: 200,
      body: { sale: '400000', state: 'priced', margin: 100 },
    });
    expect(await kit.product(id)).toMatchObject({ raw: '363000', stepCents: 100_000 });
    await kit.applyList(supplierId, [['P1', 'Martillo', 2000, 21]], 'partial');
    // 2.000 × 2 × 1,21 = 4.840, que con el paso de $ 1.000 se cobra $ 5.000.
    expect(await kit.product(id)).toMatchObject({ sale: '500000', raw: '484000', margin: 100 });
  });

  it('06-R3.4, R3.5: cambiar el redondeo recalcula los precios, y cuenta cuántos cambian', async () => {
    const id = await kit.idOf(supplierId, 'P1');
    const asked = await kit.admin.request('/api/administration/rounding');
    expect(asked.body.changes['5000']).toBeGreaterThan(0);
    expect((await kit.setStep(5000)).status).toBe(200);
    expect(await kit.product(id)).toMatchObject({ sale: '485000', stepCents: 5000 });
    expect(kit.audited('settings.changed').at(-1)).toMatchObject({
      data: { prices: 1, cents: true },
    });
    expect((await kit.setStep(100_000)).status).toBe(200);
    expect(await kit.product(id)).toMatchObject({ sale: '500000' });
  });

  it('06-R3.7: los ejemplos del panel, de verdad solo con «Ver costos»', async () => {
    const real = (await kit.viewer.device.request('/api/administration/rounding')).body;
    expect(real.examples[0]).toEqual({ name: 'Martillo', calculated: 484_000 });
    const invented = (await kit.seller.device.request('/api/administration/rounding')).body;
    expect(invented.total).toBe(real.total);
    expect(invented.examples.map((one: { name: string }) => one.name)).not.toContain('Martillo');
  });

  it('price-lists-E28, catalog-E03: un IVA cambiado a mano no lo pisa una lista', async () => {
    await kit.applyList(supplierId, [['V1', 'Pinza', 1000, 21]], 'partial');
    const id = await kit.idOf(supplierId, 'V1');
    expect((await kit.setVat(id, { before: 210, value: 270 })).status).toBe(200);
    await kit.applyList(supplierId, [['V1', 'Pinza', 1000, 21]], 'partial');
    expect(await kit.product(id)).toMatchObject({ vat: 270, vatManual: true });
  });

  it('catalog-E23: «Deshacer» un IVA a mano lo devuelve a la lista, que lo vuelve a poner', async () => {
    await kit.applyList(supplierId, [['V2', 'Tenaza', 1000, 21]], 'partial');
    const id = await kit.idOf(supplierId, 'V2');
    await kit.setVat(id, { before: 210, value: 270 });
    const undone = await kit.setVat(id, { before: 270, value: 210, undo: true });
    expect(undone.body).toMatchObject({ vat: 210, vatManual: false });
    await kit.applyList(supplierId, [['V2', 'Tenaza', 1000, 10.5]], 'partial');
    expect(await kit.product(id)).toMatchObject({ vat: 105 });
  });

  it('price-lists-E72: una unidad cambiada a mano sigue después de una lista', async () => {
    await kit.applyList(supplierId, [['K1', 'Clavos sueltos', 500]], 'partial');
    const id = await kit.idOf(supplierId, 'K1');
    expect((await kit.setUnit(id, 'un.', 'kg')).body).toMatchObject({ unit: 'kg' });
    await kit.applyList(supplierId, [['K1', 'Clavos sueltos', 600]], 'partial');
    expect(await kit.product(id)).toMatchObject({ unit: 'kg' });
  });

  it('price-lists-E95: con precios que incluyen IVA, al costo se le quita el de la lista, no el cambiado a mano', async () => {
    const other = await kit.supplier('Corralón Con IVA');
    const terms = { vatIncluded: true, discounts: [], defaultVat: 210, onChange: 'recalculate' };
    await kit.admin.request(`/api/price-lists/suppliers/${other}/terms`, { terms, version: 1 });
    await kit.applyList(other, [['I1', 'Llave', 1210, 21]], 'partial');
    const id = await kit.idOf(other, 'I1');
    await kit.setVat(id, { before: 210, value: 105 });
    await kit.applyList(other, [['I1', 'Llave', 1331, 21]], 'partial');
    expect(await kit.product(id)).toMatchObject({ vat: 105, cost: '1100000000' });
  });

  it('price-lists-E76, catalog-E05, E11: dado de baja conserva su margen; con su proveedor, «sin costo»', async () => {
    const lone = await kit.supplier('Proveedor Solo');
    await kit.applyList(lone, [
      ['B1', 'Bisagra', 100],
      ['B2', 'Pasador', 100],
    ]);
    const id = await kit.idOf(lone, 'B1');
    await kit.setMargin(id, null, 100);
    await kit.applyList(lone, [['B2', 'Pasador', 100]]);
    expect(await kit.product(id)).toMatchObject({
      discontinued: true,
      margin: 100,
      state: 'no-cost',
    });
    expect((await kit.search({ q: 'bisagra' })).products).toEqual([]);
    const gone = await kit.search({ show: 'discontinued' });
    expect(gone.products).toContainEqual(
      expect.objectContaining({ id, margin: 100, state: 'no-cost' }),
    );
    await kit.applyList(lone, [
      ['B1', 'Bisagra', 100],
      ['B2', 'Pasador', 100],
    ]);
    expect(await kit.product(id)).toMatchObject({
      discontinued: false,
      margin: 100,
      sale: '100000',
    });
    expect((await kit.search({ q: 'bisagra' })).products).toHaveLength(1);
  });
});
