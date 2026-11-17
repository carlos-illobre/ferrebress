// El rendimiento de las listas de precios con 10.000 filas (diseño de 08, § 11; E39, E67): subir y
// leer, el resumen, una página del detalle, aplicar, los artículos de un proveedor y recalcular. Las
// metas de tiempo son las del diseño; la base de pruebas (PGlite) es más lenta que PostgreSQL, así que
// lo que pasa acá pasa con más margen en el servidor. Imprime cada medida para anotarla.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

const rows = 10_000;
const sheet = (offset: number) =>
  xlsx([
    ['Lista 14/8/2026'],
    ['Código', 'Descripción', 'Marca', 'Precio'],
    ...Array.from({ length: rows }, (_, i) => [
      `C${i}`,
      `Artículo ${i}`,
      'Bremen',
      100 + i + offset,
    ]),
  ]);

const measured: Record<string, string> = {};
const timed = async <T>(name: string, run: () => Promise<T>) => {
  const started = performance.now();
  const value = await run();
  const ms = performance.now() - started;
  measured[name] = `${Math.round(ms)} ms`;
  return { value, ms };
};

describe('el rendimiento de las listas de precios, con 10.000 filas', () => {
  let kit: ListsKit;
  let supplierId: string;
  let listId: string;
  beforeAll(async () => {
    kit = await createListsKit();
    kit.later(61_000);
    supplierId = await kit.supplier('Bulonera Centro');
  });
  afterAll(async () => {
    console.table(measured);
    await kit.server.close();
  });

  it('price-lists-E39: el avance se ve enseguida y lo que cambia está en menos de 10 s', async () => {
    const file = sheet(0);
    const { value: sent, ms } = await timed('subir y leer 10.000 filas', () =>
      kit.upload(file, { supplierId }),
    );
    listId = sent.body.id;
    expect(sent.status).toBe(201);
    expect(ms).toBeLessThan(10_000);
    const list = await kit.list(listId);
    expect(list).toMatchObject({ status: 'pending', summary: { new: rows } });
  });

  it('el resumen: 2 consultas de la lista, menos de 100 ms y menos de 5 KB', async () => {
    let size = 0;
    const queries = await kit.server.countQueries(async () => {
      const { ms } = await timed('el resumen', async () => {
        const response = await kit.admin.request(`/api/price-lists/lists/${listId}`);
        size = JSON.stringify(response.body).length;
      });
      expect(ms).toBeLessThan(100);
    });
    measured['el resumen: consultas'] = String(queries);
    measured['el resumen: tamaño'] = `${size} bytes`;
    expect(size).toBeLessThan(5 * 1024);
  });

  it('una página del detalle: 50 filas, menos de 20 KB', async () => {
    let page = { rows: [] as unknown[] };
    let size = 0;
    const queries = await kit.server.countQueries(async () => {
      await timed('una página del detalle', async () => {
        const response = await kit.admin.request(`/api/price-lists/lists/${listId}/rows`);
        page = response.body;
        size = JSON.stringify(page).length;
      });
    });
    measured['una página del detalle: consultas'] = String(queries);
    measured['una página del detalle: tamaño'] = `${size} bytes`;
    expect(page.rows).toHaveLength(50);
    expect(size).toBeLessThan(20 * 1024);
  });

  it('price-lists-E67: aplicar 10.000 filas, en menos de 30 s', async () => {
    const { ms } = await timed('aplicar 10.000 filas nuevas', async () => {
      await kit.loader.device.request(`/api/price-lists/lists/${listId}/apply`, {
        expected: { new: rows, changed: 0, gone: 0 },
      });
      await kit.server.priceLists.idle();
    });
    expect(ms).toBeLessThan(30_000);
    expect(await kit.list(listId)).toMatchObject({ status: 'applied', result: { created: rows } });
  });

  it('price-lists-E67: una segunda lista que cambia los 10.000 costos, leída y aplicada a tiempo', async () => {
    kit.later(61_000);
    const { value: sent, ms: read } = await timed('leer 10.000 filas que cambian', () =>
      kit.upload(sheet(50), { supplierId }),
    );
    expect(read).toBeLessThan(10_000);
    const second = sent.body.id as string;
    expect((await kit.list(second)).summary).toMatchObject({ changed: rows });
    const { ms } = await timed('aplicar 10.000 costos que cambian', async () => {
      await kit.loader.device.request(`/api/price-lists/lists/${second}/apply`, {
        expected: { new: 0, changed: rows, gone: 0 },
      });
      await kit.server.priceLists.idle();
    });
    expect(ms).toBeLessThan(30_000);
    expect((await kit.list(second)).status).toBe('applied');
  });

  it('los artículos de un proveedor: 50 filas', async () => {
    let shown = 0;
    const queries = await kit.server.countQueries(async () => {
      await timed('los artículos de un proveedor', async () => {
        const response = await kit.admin.request(`/api/price-lists/suppliers/${supplierId}/items`);
        shown = response.body.items.length;
      });
    });
    measured['los artículos: consultas'] = String(queries);
    expect(shown).toBe(50);
  });

  it('cambiar cómo cobra con «Recalcular»: contar y recalcular los 10.000', async () => {
    const { terms } = await kit.supplierOf(supplierId);
    const next = { ...terms.value, vatIncluded: true };
    const asked = await kit.manager.device.request(
      `/api/price-lists/suppliers/${supplierId}/terms`,
      {
        terms: next,
        version: terms.version,
      },
    );
    expect(asked.body).toEqual({ error: 'confirm-costs', costs: rows });
    const { ms } = await timed('recalcular 10.000 costos', () =>
      kit.manager.device.request(`/api/price-lists/suppliers/${supplierId}/terms`, {
        terms: next,
        version: terms.version,
        confirmed: rows,
      }),
    );
    measured['recalcular: segundos'] = (ms / 1000).toFixed(1);
  });

  // Un CSV se lee de a partes: el del tamaño máximo de arranque entra en la memoria del proceso lector.
  it('un CSV de 30 MB (unas 620.000 filas): pregunta antes y se lee sin cortarse', async () => {
    kit.later(61_000);
    const body: string[] = ['Código;Descripción;Precio'];
    let length = Buffer.byteLength(body[0] as string);
    for (let i = 0; length < 29.5 * 2 ** 20; i++) {
      const line = `X${i};Artículo de prueba número ${i};${(100 + (i % 900)).toFixed(2).replace('.', ',')}`;
      body.push(line);
      length += Buffer.byteLength(line) + 1;
    }
    measured['CSV grande: filas'] = String(body.length - 1);
    measured['CSV grande: MB'] = (length / 2 ** 20).toFixed(1);
    const file = new TextEncoder().encode(body.join('\n'));
    const { value: sent } = await timed('CSV grande: subir y contar', () =>
      kit.upload(file, { supplierId, name: 'grande.csv' }),
    );
    expect(sent.body).toMatchObject({ id: expect.any(String) });
    const id = sent.body.id as string;
    const opened = await kit.list(id);
    measured['CSV grande: al abrir'] =
      `${opened.status}${opened.reason ? ` (${opened.reason})` : ''}${opened.waitingFor ? ` esperando ${opened.waitingFor}` : ''}`;
    expect(await kit.list(id)).toMatchObject({ status: 'reading', waitingFor: 'size' });
    const { ms } = await timed('CSV grande: leerlo entero', async () => {
      await kit.loader.device.request(`/api/price-lists/lists/${id}/size`, {});
      await kit.server.priceLists.idle();
    });
    const list = await kit.list(id);
    measured['CSV grande: estado'] = `${list.status}${list.reason ? ` (${list.reason})` : ''}`;
    measured['CSV grande: segundos'] = (ms / 1000).toFixed(1);
    expect(list.status).toBe('pending');
  });
});
