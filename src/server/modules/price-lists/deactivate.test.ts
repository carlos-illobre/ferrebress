// Dar de baja y reactivar un proveedor (08 · R2.4 a R2.6; diseño de 08, § 3): se confirma con
// cuántos pierden su costo y cuántos quedan dados de baja, y no se puede con una lista aplicándose.
import type { Terms } from '@ferrebress/shared/contracts/price-lists';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createPriceListsKit,
  type PriceListsKit,
} from '../../testing/price-lists/price-lists-kit.ts';

const terms = (more: Partial<Terms> = {}): Terms => ({
  vatIncluded: false,
  discounts: [],
  defaultVat: 210,
  onChange: 'recalculate',
  ...more,
});

describe('dar de baja y reactivar un proveedor', () => {
  let kit: PriceListsKit;
  beforeAll(async () => {
    kit = await createPriceListsKit();
  });
  afterAll(() => kit.server.close());

  const deactivate = (id: string, confirmed?: object) =>
    kit.admin.request(
      `/api/price-lists/suppliers/${id}/deactivate`,
      confirmed ? { confirmed } : {},
    );
  const listed = async (id: string) =>
    (await kit.admin.request('/api/price-lists/suppliers')).body.suppliers.some(
      (one: { id: string }) => one.id === id,
    );

  it('price-lists-E12 y E13 (en parte): antes se ve cuántos pierden su costo; confirmado, sale de la lista con sus productos de baja y su lista descartada', async () => {
    const id = await kit.supplier('Bulonera Centro');
    const rows = await kit.articles(id, [
      { code: 'A1', listPrice: 1_000_000n },
      { code: 'A2', listPrice: 2_000_000n },
    ]);
    const listId = await kit.pendingList(id, [{ code: 'A1', listPrice: 1_000_000n }]);
    const asked = await deactivate(id);
    expect(asked.status).toBe(409);
    expect(asked.body).toEqual({ error: 'confirm-deactivate', costs: 2, discontinued: 2 });
    expect(await listed(id)).toBe(true);
    const done = await deactivate(id, { costs: 2, discontinued: 2 });
    expect(done.body).toEqual({ ok: true, costs: 2, discontinued: 2 });
    expect(await listed(id)).toBe(false);
    expect((await kit.admin.request('/api/price-lists/suppliers/inactive')).body.suppliers).toEqual(
      [{ id, name: 'Bulonera Centro' }],
    );
    const products = await kit.products(rows.map((row) => row.productId));
    expect(products.map((one) => [one.cost, one.supplierId, one.discontinued])).toEqual([
      [null, null, true],
      [null, null, true],
    ]);
    expect(await kit.listStatus(listId)).toEqual({
      status: 'discarded',
      reason: 'supplier-inactive',
    });
    expect(kit.audited('suppliers.deactivated').at(-1)).toMatchObject({
      tone: 'amber',
      data: { costs: 2, discontinued: 2 },
    });
  });

  it('price-lists-E14: reactivado, vuelve con sus datos y cómo cobra, sin productos hasta su próxima lista', async () => {
    const id = await kit.supplier('Aceros Sur');
    await kit.admin.request(`/api/price-lists/suppliers/${id}/terms`, {
      terms: terms({ defaultVat: 105 }),
      version: 1,
    });
    await kit.articles(id, [{ code: 'A1', listPrice: 1_000_000n }]);
    await deactivate(id, { costs: 1, discontinued: 1 });
    const again = await kit.admin.request(`/api/price-lists/suppliers/${id}/reactivate`, {});
    expect(again.body).toEqual({ ok: true });
    expect(await listed(id)).toBe(true);
    expect((await kit.supplierOf(id)).terms.value.defaultVat).toBe(105);
    expect((await kit.itemCosts(id))[0]?.discontinued).toBe(true);
    expect(kit.audited('suppliers.reactivated').at(-1)?.targets).toEqual([
      { kind: 'supplier', id, name: 'Aceros Sur' },
    ]);
    expect(
      (await kit.admin.request(`/api/price-lists/suppliers/${id}/reactivate`, {})).status,
    ).toBe(409);
    expect(
      (await kit.admin.request(`/api/price-lists/suppliers/${kit.uuid()}/reactivate`, {})).status,
    ).toBe(404);
  });

  it('price-lists-E94: dar de alta uno con el nombre de un dado de baja ofrece reactivarlo', async () => {
    const id = await kit.supplier('Ferretera del Sur');
    await deactivate(id, { costs: 0, discontinued: 0 });
    const again = await kit.admin.request('/api/price-lists/suppliers', {
      name: 'FERRETERA DEL SUR',
    });
    expect(again.status).toBe(409);
    expect(again.body).toEqual({ error: 'supplier-inactive', id });
    expect((await deactivate(id, { costs: 0, discontinued: 0 })).status).toBe(404);
  });

  it('ver los dados de baja y dar de baja piden «Administrar proveedores»', async () => {
    expect((await kit.viewer.device.request('/api/price-lists/suppliers/inactive')).status).toBe(
      403,
    );
    const id = await kit.supplier('Maderera Uno');
    const refused = await kit.viewer.device.request(
      `/api/price-lists/suppliers/${id}/deactivate`,
      {},
    );
    expect(refused.status).toBe(403);
    expect((await deactivate(kit.uuid())).status).toBe(404);
  });
});
