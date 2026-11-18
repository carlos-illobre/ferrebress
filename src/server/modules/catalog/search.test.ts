// Buscar en el catálogo desde la aplicación (07 · R3, R4.1): por palabras y por código, en orden, con
// los números de arriba, de a páginas, los filtros, las marcas, sin sesión y lo que no vale.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type CatalogKit, createCatalogKit } from '../../testing/catalog/catalog-kit.ts';
import { createDevice } from '../../testing/sign-in/sign-in-server.ts';
import { catalogSettings } from './settings.ts';

type Page = { products: { id: string; description: string; state: string }[]; next?: string };
const names = (page: Page) => page.products.map((one) => one.description);

describe('buscar en el catálogo', () => {
  let kit: CatalogKit;
  let supplierId: string;
  beforeAll(async () => {
    kit = await createCatalogKit();
    supplierId = await kit.supplier('Ferretería Norte');
    await kit.applyList(supplierId, [
      ['T-81', 'Tornillo autoperforante 8 x 1', 100, 21, 'Fischer'],
      ['A-1.2', 'Clavo punta paris', 100, 21, 'Acindar'],
      ['X9', 'Arandela A12 plana', 100, 21, 'Fischer'],
      ['MC-1', 'Martillo carpintero', 100, 21, '', '7790001000017'],
      ['TO1', 'Torno de banco', 100, 21],
    ]);
    // Uno con margen: tiene precio.
    await kit.setMargin(await kit.idOf(supplierId, 'X9'), null, 50);
  });
  afterAll(() => kit.server.close());

  it('catalog-E16: sin nada escrito, en orden alfabético, con cuántos hay y cuántos sin precio', async () => {
    const page = await kit.search();
    expect(names(page)).toEqual([
      'Arandela A12 plana',
      'Clavo punta paris',
      'Martillo carpintero',
      'Tornillo autoperforante 8 x 1',
      'Torno de banco',
    ]);
    expect(page).toMatchObject({ total: 5, noPrice: 4, stepCents: 100_000 });
    expect(page.next).toBeUndefined();
  });

  it('catalog-E12: por palabras empezadas, con un error o en mayúsculas', async () => {
    expect(names(await kit.search({ q: 'autoperf torn' }))).toEqual([
      'Tornillo autoperforante 8 x 1',
    ]);
    expect(names(await kit.search({ q: 'tornilo' }))).toEqual(['Tornillo autoperforante 8 x 1']);
    expect(names(await kit.search({ q: 'TORNILLO' }))).toEqual(['Tornillo autoperforante 8 x 1']);
  });

  it('catalog-E13, E14: el código entero va primero, aunque tenga signos; el de barras también', async () => {
    expect(names(await kit.search({ q: 'A12' }))).toEqual([
      'Clavo punta paris',
      'Arandela A12 plana',
    ]);
    expect(names(await kit.search({ q: '7790001000017' }))).toEqual(['Martillo carpintero']);
  });

  it('catalog-R3.4: por marca y «Sin precio»; los números son de la marca; y las marcas', async () => {
    const fischer = await kit.search({ brand: 'fischer' });
    expect(fischer).toMatchObject({ total: 2, noPrice: 1 });
    expect(names(await kit.search({ show: 'noPrice', brand: 'Fischer' }))).toEqual([
      'Tornillo autoperforante 8 x 1',
    ]);
    expect((await kit.admin.request('/api/catalog/brands')).body).toEqual({
      brands: ['Acindar', 'Fischer'],
    });
  });

  it('catalog-E17: sin «Ver costos» se ve el precio, no el margen ni el costo', async () => {
    const id = await kit.idOf(supplierId, 'X9');
    const [row] = (await kit.search({ q: 'arandela' }, kit.seller.device)).products;
    expect(row).toMatchObject({ id, sale: '100000', state: 'priced' });
    expect(row).not.toHaveProperty('margin');
    expect(row).not.toHaveProperty('cost');
    const one = await kit.product(id, kit.seller.device);
    expect(one).toMatchObject({ sale: '100000' });
    for (const hidden of ['margin', 'cost', 'supplier', 'basis', 'raw'])
      expect(one).not.toHaveProperty(hidden);
  });

  it('de a páginas: la siguiente sale de la misma búsqueda, sin volver a buscar', async () => {
    const { page } = catalogSettings;
    catalogSettings.page = 2;
    try {
      const first = await kit.search();
      expect(names(first)).toHaveLength(2);
      const second = await kit.search({ after: first.next as string });
      expect(names(second)).toEqual(['Martillo carpintero', 'Tornillo autoperforante 8 x 1']);
      const third = await kit.search({ after: second.next as string });
      expect(names(third)).toEqual(['Torno de banco']);
      expect(third.next).toBeUndefined();
      // Otra búsqueda con `after` no reusa la anterior.
      expect(names(await kit.search({ q: 'torn', after: '0' }))).toEqual([
        'Tornillo autoperforante 8 x 1',
        'Torno de banco',
      ]);
    } finally {
      catalogSettings.page = page;
    }
  });

  it('catalog-E05: los dados de baja, de a páginas por su clave', async () => {
    const lone = await kit.supplier('Proveedor Solo');
    await kit.applyList(lone, [
      ['G1', 'Gancho', 1],
      ['G2', 'Grampa', 1],
      ['G3', 'Garfio', 1],
      ['G4', 'Queda', 1],
    ]);
    await kit.applyList(lone, [['G4', 'Queda', 1]]);
    const { page } = catalogSettings;
    catalogSettings.page = 2;
    try {
      const first = await kit.search({ show: 'discontinued' });
      expect(names(first)).toEqual(['Gancho', 'Garfio']);
      expect(first).toMatchObject({ total: 6, noPrice: 5 });
      const second = await kit.search({ show: 'discontinued', after: first.next as string });
      expect(names(second)).toEqual(['Grampa']);
      expect(second.next).toBeUndefined();
    } finally {
      catalogSettings.page = page;
    }
  });

  it('catalog-E26: sin sesión, nada', async () => {
    const outsider = createDevice(kit.server);
    for (const path of ['/api/catalog/products', '/api/catalog/brands', '/api/catalog/products/x'])
      expect((await outsider.request(path)).status).toBe(401);
  });

  it('lo que no vale: 400; un producto que no existe: 404', async () => {
    for (const query of [
      { q: 'x'.repeat(81) },
      { show: 'todo' },
      { after: 'tres' },
      { show: 'discontinued', after: 'no es json' },
      { show: 'discontinued', after: '["a","no-es-un-id"]' },
      { extra: '1' },
    ])
      expect(
        (await kit.admin.request(`/api/catalog/products?${new URLSearchParams(query)}`)).status,
      ).toBe(400);
    expect((await kit.admin.request('/api/catalog/products/nada')).status).toBe(404);
    expect(
      (await kit.admin.request('/api/catalog/products/0190a000-0000-7000-8000-000000000000'))
        .status,
    ).toBe(404);
  });

  it('el límite de búsquedas por sesión', async () => {
    const { max } = catalogSettings.limits.search;
    const device = kit.viewer.device;
    const statuses = [];
    for (let i = 0; i <= max; i++)
      statuses.push((await device.request('/api/catalog/products?q=a')).status);
    expect(statuses.filter((status) => status === 200)).toHaveLength(max);
    expect(statuses.at(-1)).toBe(429);
  });
});
