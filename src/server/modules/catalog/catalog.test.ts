// La fachada del catálogo (08 · R7; diseño de 08, § 1): lo que hace una lista con los productos, en
// lote y dentro de su transacción. Si la transacción se deshace, no queda nada (R4.11).
import type { Kysely, Transaction } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSignInServer, type SignInServer } from '../../testing/sign-in/sign-in-server.ts';
import type { NewProduct } from './index.ts';

describe('el catálogo', () => {
  let server: SignInServer;
  let db: Kysely<unknown>;
  let count = 0;

  beforeAll(async () => {
    server = await createSignInServer();
    db = server.platform.db;
  });
  afterAll(() => server.close());

  const supplier = '0190a000-0000-7000-8000-00000000000a';
  const product = (more: Partial<NewProduct> = {}): NewProduct => ({
    id: `0190a000-0000-7000-8000-${String(++count).padStart(12, '0')}`,
    description: `Tornillo ${count}`,
    brand: 'Fischer',
    barcode: null,
    vat: 210,
    cost: 1_648_725_000n,
    supplierId: supplier,
    ...more,
  });
  const run = (work: (trx: Transaction<unknown>) => Promise<void>) =>
    db.transaction().execute(work);
  const read = (ids: string[]) => server.catalog.read(db, ids);

  it('price-lists-R7.2: crea los productos con su costo, en un.; sin margen', async () => {
    const [one, two] = [product(), product({ brand: null, barcode: '7790001000017', vat: 105 })];
    await run((trx) => server.catalog.create(trx, [one, two]));
    expect(await read([one.id, two.id])).toEqual([
      {
        id: one.id,
        description: one.description,
        brand: 'Fischer',
        barcode: null,
        unit: 'un.',
        vat: 210,
        vatManual: false,
        cost: 1_648_725_000n,
        supplierId: supplier,
        discontinued: false,
      },
      expect.objectContaining({ id: two.id, brand: null, barcode: '7790001000017', vat: 105 }),
    ]);
  });

  it('un costo muy grande no pierde precisión', async () => {
    const big = product({ cost: 99_999_999_999_900n });
    await run((trx) => server.catalog.create(trx, [big]));
    await run((trx) =>
      server.catalog.setCosts(trx, [
        { id: big.id, cost: 99_999_999_999_901n, supplierId: supplier },
      ]),
    );
    expect((await read([big.id]))[0]?.cost).toBe(99_999_999_999_901n);
  });

  it('price-lists-R7.3: pone al día lo que trae el artículo; el IVA cambiado a mano no se toca', async () => {
    const [kept, manual] = [product(), product()];
    await run((trx) => server.catalog.create(trx, [kept, manual]));
    await db
      .withTables<{ 'catalog.products': { id: string; vat_manual: boolean } }>()
      .updateTable('catalog.products')
      .set({ vat_manual: true })
      .where('id', '=', manual.id)
      .execute();
    const change = { description: 'Tornillo nuevo', brand: 'Otra', barcode: '1', vat: 105 };
    await run((trx) =>
      server.catalog.update(trx, [
        { id: kept.id, ...change },
        { id: manual.id, ...change },
      ]),
    );
    const [first, second] = await read([kept.id, manual.id]);
    expect(first).toMatchObject({ ...change, vat: 105 });
    expect(second).toMatchObject({ description: 'Tornillo nuevo', vat: 210, vatManual: true });
  });

  it('price-lists-R7.4 y R7.5: se da de baja conservando todo, y vuelve', async () => {
    const one = product();
    await run((trx) => server.catalog.create(trx, [one]));
    await run((trx) =>
      server.catalog.setCosts(trx, [{ id: one.id, cost: null, supplierId: null }]),
    );
    await run((trx) => server.catalog.discontinue(trx, [one.id]));
    expect((await read([one.id]))[0]).toMatchObject({
      description: one.description,
      cost: null,
      supplierId: null,
      discontinued: true,
    });
    await run((trx) => server.catalog.restore(trx, [one.id]));
    expect((await read([one.id]))[0]?.discontinued).toBe(false);
  });

  it('price-lists-R4.11: si la transacción se deshace, no queda ningún producto', async () => {
    const lost = product();
    await expect(
      run(async (trx) => {
        await server.catalog.create(trx, [lost]);
        throw new Error('cancelada');
      }),
    ).rejects.toThrow('cancelada');
    expect(await read([lost.id])).toEqual([]);
  });

  it('una tanda vacía no consulta la base', async () => {
    const queries = await server.countQueries(() =>
      run(async (trx) => {
        await server.catalog.create(trx, []);
        await server.catalog.update(trx, []);
        await server.catalog.setCosts(trx, []);
        await server.catalog.discontinue(trx, []);
      }),
    );
    expect(queries).toBe(2);
    expect(await read([])).toEqual([]);
  });
});
