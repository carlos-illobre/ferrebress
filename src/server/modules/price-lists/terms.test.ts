// Cómo cobra un proveedor, darlo de baja y reactivarlo (08 · R2.4 a R2.6, R3; diseño de 08, § 3):
// lo que cambia costos se confirma con cuántos y es todo o nada.
import type { Terms } from '@ferrebress/shared/contracts/price-lists';
import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createPriceListsKit,
  type PriceListsKit,
} from '../../testing/price-lists/price-lists-kit.ts';

const general = { id: 'g', name: 'General', percent: 2500, brand: null };
const cash = { id: 'c', name: 'Contado', percent: 500, brand: null };
const terms = (more: Partial<Terms> = {}): Terms => ({
  vatIncluded: false,
  discounts: [],
  defaultVat: 210,
  onChange: 'recalculate',
  ...more,
});

describe('cómo cobra un proveedor', () => {
  let kit: PriceListsKit;
  beforeAll(async () => {
    kit = await createPriceListsKit();
  });
  afterAll(() => kit.server.close());

  const save = (id: string, body: object, device = kit.admin) =>
    device.request(`/api/price-lists/suppliers/${id}/terms`, body);
  const withArticles = async (name: string) => {
    const id = await kit.supplier(name);
    const rows = await kit.articles(id, [
      { code: 'A1', listPrice: 2_314_000_000n },
      { code: 'A2', listPrice: 1_000_000_000n, brand: 'Bremen' },
      { code: 'A3', listPrice: 500_000_000n },
    ]);
    return { id, rows };
  };

  it('price-lists-E21 y E23: con «Recalcular», antes se ve cuántos costos cambian y sin confirmar no cambia nada', async () => {
    const { id } = await withArticles('Bulonera Centro');
    const asked = await save(id, { terms: terms({ discounts: [general] }), version: 1 });
    expect(asked.status).toBe(409);
    expect(asked.body).toEqual({ error: 'confirm-costs', costs: 3 });
    expect(
      (await save(id, { terms: terms({ discounts: [general] }), version: 1, confirmed: 2 })).body,
    ).toEqual({ error: 'confirm-costs', costs: 3 });
    expect((await kit.supplierOf(id)).terms).toEqual({ value: terms(), version: 1 });
    expect((await kit.itemCosts(id)).map((one) => one.cost)).toEqual([
      '2314000000',
      '1000000000',
      '500000000',
    ]);
  });

  it('price-lists-E17 y E22: confirmado, los costos quedan con el descuento nuevo, en los artículos y los productos', async () => {
    const { id, rows } = await withArticles('Aceros Sur');
    const saved = await save(id, {
      terms: terms({ discounts: [general, cash] }),
      version: 1,
      confirmed: 3,
    });
    expect(saved.body).toEqual({
      value: terms({ discounts: [general, cash] }),
      version: 2,
      costs: 3,
    });
    expect((await kit.itemCosts(id))[0]?.cost).toBe('1648725000');
    const products = await kit.products(rows.map((row) => row.productId));
    expect(products.find((one) => one.id === rows[0]?.productId)?.cost).toBe(1_648_725_000n);
    const event = kit.audited('suppliers.terms-changed').at(-1);
    expect(event).toMatchObject({
      targets: [{ kind: 'supplier', id, name: 'Aceros Sur' }],
      data: { costs: 3 },
      changes: { terms: { before: terms(), after: terms({ discounts: [general, cash] }) } },
    });
  });

  it('price-lists-E19: un descuento de una marca solo cambia los costos de esa marca', async () => {
    const { id } = await withArticles('Bulonera Siete');
    const bremen = { id: 'b', name: 'Bremen', percent: 1000, brand: 'bremen' };
    const asked = await save(id, { terms: terms({ discounts: [bremen] }), version: 1 });
    expect(asked.body).toEqual({ error: 'confirm-costs', costs: 1 });
  });

  it('price-lists-E18 y E19: el IVA incluido se quita y un descuento de una marca solo le toca a esa', async () => {
    const { id } = await withArticles('Corralón Norte');
    const bremen = { id: 'b', name: 'Bremen', percent: 1000, brand: 'BREMEN' };
    await save(id, {
      terms: terms({ vatIncluded: true, discounts: [bremen] }),
      version: 1,
      confirmed: 3,
    });
    expect((await kit.itemCosts(id)).map((one) => one.cost)).toEqual([
      '1912396694',
      '743801652',
      '413223140',
    ]);
  });

  it('price-lists-E24: con «Desde la próxima lista», se guarda sin preguntar y los costos quedan; la lista en espera se calcula con lo nuevo', async () => {
    const { id } = await withArticles('Pinturería Oeste');
    await save(id, { terms: terms({ onChange: 'next' }), version: 1 });
    const listId = await kit.pendingList(id, [
      { code: 'A1', listPrice: 2_314_000_000n, previousCost: 2_314_000_000n },
      { code: 'N1', listPrice: 100_000_000n },
    ]);
    const saved = await save(id, {
      terms: terms({ onChange: 'next', discounts: [general, cash] }),
      version: 2,
    });
    expect(saved.body).toMatchObject({ version: 3, costs: 0 });
    expect((await kit.itemCosts(id))[0]?.cost).toBe('2314000000');
    expect(await kit.rowCosts(listId)).toEqual([
      { cost: '1648725000', change: 'changed' },
      { cost: '71250000', change: 'new' },
    ]);
  });

  it('cambiar solo el IVA de arranque no cambia costos ni pregunta; la lista en espera lo usa', async () => {
    const { id } = await withArticles('Sanitarios Este');
    await save(id, { terms: terms({ vatIncluded: true }), version: 1, confirmed: 3 });
    const listId = await kit.pendingList(id, [
      { code: 'A3', listPrice: 1_105_000_000n, previousCost: 1n },
    ]);
    const saved = await save(id, {
      terms: terms({ vatIncluded: true, defaultVat: 105 }),
      version: 2,
    });
    expect(saved.body.costs).toBe(0);
    expect(await kit.rowCosts(listId)).toEqual([{ cost: '1000000000', change: 'changed' }]);
  });

  it('un descuento que solo cambia de nombre no pregunta: cambia la cuenta, no el costo', async () => {
    const { id } = await withArticles('Herrería Cinco');
    await save(id, { terms: terms({ discounts: [general] }), version: 1, confirmed: 3 });
    const renamed = await save(id, {
      terms: terms({ discounts: [{ ...general, name: 'Especial' }] }),
      version: 2,
    });
    expect(renamed.body.costs).toBe(0);
    const basis = await sql<{ basis: { discounts: { name: string }[] } }>`select basis from
      price_lists.items where supplier_id = ${id} and supplier_code = 'A1'`.execute(
      kit.server.platform.db,
    );
    expect(basis.rows[0]?.basis.discounts).toEqual([{ name: 'Especial', percent: 2500 }]);
  });

  it('price-lists-E26: una fila que dice su IVA se calcula con ese, no con el de arranque', async () => {
    const id = await kit.supplier('Plomería Seis');
    await save(id, { terms: terms({ onChange: 'next' }), version: 1 });
    const listId = await kit.pendingList(id, [
      { code: 'X', listPrice: 1_105_000_000n, vat: 105 },
      { code: 'Y', listPrice: 1_210_000_000n, previousCost: 1_000_000_000n },
    ]);
    await save(id, { terms: terms({ onChange: 'next', vatIncluded: true }), version: 2 });
    expect(await kit.rowCosts(listId)).toEqual([
      { cost: '1000000000', change: 'new' },
      { cost: '1000000000', change: 'same' },
    ]);
  });

  it('price-lists-E25: si recalcular falla a mitad, no cambia ni cómo cobra ni ningún costo', async () => {
    const { id } = await withArticles('Maderera Uno');
    await sql`update price_lists.items set basis = '{"listPrice": "no"}'::jsonb where supplier_id = ${id} and supplier_code = 'A3'`.execute(
      kit.server.platform.db,
    );
    const failed = await save(id, {
      terms: terms({ discounts: [general] }),
      version: 1,
      confirmed: 3,
    });
    expect(failed.status).toBe(503);
    expect(failed.body).toEqual({ error: 'recalc-failed' });
    expect((await kit.supplierOf(id)).terms.version).toBe(1);
    expect((await kit.itemCosts(id))[0]?.cost).toBe('2314000000');
  });

  it('otro cambió cómo cobra antes: se ve lo de ahora', async () => {
    const id = await kit.supplier('Vidriería Dos');
    await save(id, { terms: terms({ defaultVat: 270 }), version: 1 });
    const late = await save(id, { terms: terms({ defaultVat: 105 }), version: 1 });
    expect(late.status).toBe(409);
    expect(late.body).toEqual({
      error: 'terms-changed',
      value: terms({ defaultVat: 270 }),
      version: 2,
    });
  });

  it('price-lists-E20 y E92: un descuento de 0, 100, negativo, con más de dos decimales o texto no se guarda', async () => {
    const id = await kit.supplier('Electricidad Tres');
    for (const percent of [0, 10_000, -500, 2.5, '25'])
      expect(
        (
          await save(id, {
            terms: terms({ discounts: [{ ...general, percent } as never] }),
            version: 1,
          })
        ).status,
      ).toBe(400);
    const ok = await save(id, {
      terms: terms({ discounts: [{ ...general, percent: 250 }] }),
      version: 1,
    });
    expect(ok.status).toBe(200);
  });

  it('cambiar cómo cobra pide «Administrar proveedores»', async () => {
    const id = await kit.supplier('Herrajes Cuatro');
    const refused = await save(id, { terms: terms(), version: 1 }, kit.loader.device);
    expect(refused.body).toMatchObject({ error: 'forbidden', permission: 'price-lists.suppliers' });
    expect((await save(kit.uuid(), { terms: terms(), version: 1 })).status).toBe(404);
  });
});
