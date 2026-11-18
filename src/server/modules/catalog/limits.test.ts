// El tope de productos (07 · R3.5, E25; 08 · R7.7) y la migración de los productos que ya había.
import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type CatalogKit, createCatalogKit } from '../../testing/catalog/catalog-kit.ts';
import { addPrices } from './migrations/002-prices.ts';
import { addBrandKey } from './migrations/003-brand-key.ts';
import { catalogSettings } from './settings.ts';

describe('los límites del catálogo', () => {
  let kit: CatalogKit;
  let supplierId: string;
  beforeAll(async () => {
    kit = await createCatalogKit();
    supplierId = await kit.supplier('Ferretería Norte');
  });
  afterAll(() => kit.server.close());

  it('catalog-E25: una lista que haría pasar el tope no se aplica y dice por cuántos', async () => {
    await kit.applyList(
      supplierId,
      [
        ['A1', 'Uno', 1],
        ['A2', 'Dos', 1],
      ],
      'partial',
    );
    const { maxActive } = catalogSettings;
    catalogSettings.maxActive = 3;
    try {
      const id = await kit.applyList(
        supplierId,
        [
          ['A3', 'Tres', 1],
          ['A4', 'Cuatro', 1],
          ['A5', 'Cinco', 1],
        ],
        'partial',
      );
      expect(await kit.list(id)).toMatchObject({
        status: 'pending',
        reason: 'catalog-full',
        over: 2,
      });
      expect((await kit.search()).total).toBe(2);
      // Una que solo cambia costos sí se aplica.
      const changes = await kit.applyList(supplierId, [['A1', 'Uno', 2]], 'partial');
      expect(await kit.list(changes)).toMatchObject({ status: 'applied' });
    } finally {
      catalogSettings.maxActive = maxActive;
    }
  });

  it('catalog-R3.5: traer de vuelta productos dados de baja también mira el tope', async () => {
    const back = await kit.supplier('Proveedor Vuelve');
    await kit.applyList(back, [
      ['R1', 'Vuelve uno', 1],
      ['R2', 'Vuelve dos', 1],
    ]);
    await kit.applyList(back, [['R2', 'Vuelve dos', 1]]);
    const active = (await kit.search()).total;
    const { maxActive } = catalogSettings;
    catalogSettings.maxActive = active;
    try {
      const id = await kit.applyList(back, [
        ['R1', 'Vuelve uno', 1],
        ['R2', 'Vuelve dos', 1],
      ]);
      expect(await kit.list(id)).toMatchObject({
        status: 'pending',
        reason: 'catalog-full',
        over: 1,
      });
    } finally {
      catalogSettings.maxActive = maxActive;
    }
  });

  it('la migración: el código de su artículo, la clave de orden y el IVA de la lista', async () => {
    const db = kit.server.platform.db;
    const id = await kit.idOf(supplierId, 'A1');
    await sql`update catalog.products set supplier_code = '', search_key = '' where id = ${id}`.execute(
      db,
    );
    // Lo que agrega la migración se saca para volver a correrla sobre lo que ya hay.
    await sql`drop table catalog.pricing`.execute(db);
    await sql`drop index catalog.products_discontinued_key`.execute(db);
    await sql`alter table catalog.products drop column supplier_code, drop column margin,
      drop column raw_cents, drop column sale_cents, drop column vat_from_list,
      drop column search_key`.execute(db);
    await addPrices.up(db);
    const { rows } = await sql<{ code: string; key: string; vat: number }>`
      select supplier_code as code, search_key as key, vat_from_list as vat
      from catalog.products where id = ${id}`.execute(db);
    expect(rows[0]).toEqual({ code: 'A1', key: 'uno', vat: 210 });
    await sql`insert into catalog.pricing (step_cents) values (100000)`.execute(db);
  });

  it('la migración 003: la marca como clave, y el IVA de la lista de un IVA puesto a mano', async () => {
    const db = kit.server.platform.db;
    await kit.applyList(supplierId, [['M9', 'Con marca', 1, 21, 'Bremen']], 'partial');
    const id = await kit.idOf(supplierId, 'M9');
    await sql`update catalog.products set vat = 270, vat_manual = true, vat_from_list = 270
      where id = ${id}`.execute(db);
    await sql`alter table catalog.products drop column brand_key`.execute(db);
    await addBrandKey.up(db);
    const { rows } = await sql<{ brand: string; vat: number }>`
      select brand_key as brand, vat_from_list as vat from catalog.products where id = ${id}`.execute(
      db,
    );
    expect(rows[0]).toEqual({ brand: 'bremen', vat: 210 });
  });
});
