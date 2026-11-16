// Leer una lista en el proceso lector (08 · R4, R5): elegir el lector, leer de a bloques y comprobar.
import { describe, expect, it } from 'vitest';
import {
  job,
  limits,
  type Rows,
  reader,
  run,
  saved,
  types,
  xlsx,
} from '../../../testing/price-lists/sheets.ts';

const formatA: Rows = [['FORMATO A'], ['A1', 'Mecha', 100], ['A2', 'Tarugo', 200]];

describe('leer una lista', () => {
  it('price-lists-E42: el lector automático, con la marca del renglón de arriba, la fecha y el proveedor por su nombre', async () => {
    const path = saved(
      xlsx([
        ['Lista de Ixnova — 14/8/2026'],
        ['Código', 'Descripción', 'Precio Unitario'],
        ['BREMEN'],
        ['B1', 'Mecha 6', 1200.5],
        ['B2', 'Mecha 8', '1.500,00'],
      ]),
    );
    const sent = await run(job(path, { suppliers: [{ id: 'ix', nameKey: 'ixnova' }] }));
    expect(types(sent)).toEqual(['opened', 'chosen', 'block', 'done']);
    expect(sent[0]).toEqual({ type: 'opened', rows: 5 });
    expect(sent[1]).toMatchObject({
      reader: { template: 'auto-1', params: { columns: { code: 0, description: 1, price: 2 } } },
      supplier: { id: 'ix', from: 'name' },
      date: { date: '2026-08-14', from: 'sheet' },
    });
    expect(sent[2]).toMatchObject({
      rowsRead: 5,
      skipped: [],
      products: [
        { code: 'B1', brand: 'BREMEN', listPrice: 1_200_500_000n },
        { code: 'B2', brand: 'BREMEN', listPrice: 1_500_000_000n },
      ],
    });
  });

  it('price-lists-E29 y E41: el lector de un proveedor que la reconoce decide; con dos, el que entiende el formato', async () => {
    const path = saved(xlsx(formatA));
    const readers = [reader('nuevo', 'bul', 'FORMATO B'), reader('viejo', 'bul', 'FORMATO A')];
    const sent = await run(job(path, { readers }));
    expect(sent[1]).toMatchObject({
      reader: { id: 'viejo' },
      supplier: { id: 'bul', from: 'reader' },
    });
    expect(sent[2]).toMatchObject({ products: [{ code: 'A1' }, { code: 'A2' }] });
  });

  it('con el proveedor ya sabido, no se prueban los lectores de otros ni se deduce', async () => {
    const path = saved(xlsx(formatA));
    const sent = await run(
      job(path, { supplierId: 'otro', readers: [reader('ajeno', 'bul', 'FORMATO A')] }),
    );
    expect(sent.at(-1)).toEqual({ type: 'failed', reason: 'no-reader' });
    const own = await run(
      job(path, { supplierId: 'bul', readers: [reader('suyo', 'bul', 'FORMATO A')] }),
    );
    expect(own[1]).toMatchObject({ reader: { id: 'suyo' }, supplier: null });
    // Uno de un programador sin proveedor también sirve, después de los del proveedor.
    const both = [reader('prog', null, 'FORMATO A'), reader('suyo', 'bul', 'FORMATO A')];
    expect((await run(job(path, { supplierId: 'bul', readers: both })))[1]).toMatchObject({
      reader: { id: 'suyo' },
    });
    const onlyProg = [reader('prog', null, 'FORMATO A')];
    expect((await run(job(path, { supplierId: 'bul', readers: onlyProg })))[1]).toMatchObject({
      reader: { id: 'prog' },
    });
  });

  it('price-lists-E93: uno de un programador sin proveedor lee, y de quién es se pregunta', async () => {
    const path = saved(xlsx(formatA));
    const sent = await run(job(path, { readers: [reader('prog', null, 'FORMATO A')] }));
    expect(sent[1]).toMatchObject({
      reader: { id: 'prog' },
      supplier: null,
      date: { from: 'server' },
    });
  });

  it('price-lists-E48, E52 y E53: un lector que señala lo que no existe, que no termina o que sale no se usa', async () => {
    const path = saved(xlsx(formatA));
    const readers = [
      reader(
        'lejos',
        'bul',
        'FORMATO A',
        'return block.rows.map((_, i) => ({ row: block.start + i, kind: "product", at: { code: [900, 0], description: [1, 1], price: [1, 2] } }));',
      ),
      reader('bucle', 'bul', 'FORMATO A', 'for (;;) {}'),
      reader('sale', 'bul', 'FORMATO A', 'process.exit(1);'),
      reader('bueno', 'bul', 'FORMATO A'),
    ];
    const sent = await run(job(path, { readers, limits: { ...limits, timeMs: 200 } }));
    expect(sent[1]).toMatchObject({ reader: { id: 'bueno' } });
  });

  it('una planilla grande se lee de a bloques; si un bloque no pasa, la lista no se lee', async () => {
    const rows: Rows = [
      ['FORMATO A'],
      ...Array.from({ length: 11_000 }, (_, i) => [`C${i}`, `Artículo ${i}`, 10 + i]),
    ];
    const path = saved(xlsx(rows));
    const sent = await run(job(path, { readers: [reader('bueno', 'bul', 'FORMATO A')] }));
    expect(types(sent)).toEqual(['opened', 'chosen', 'block', 'block', 'block', 'done']);
    expect(
      sent.filter((m) => m.type === 'block').map((m) => 'rowsRead' in m && m.rowsRead),
    ).toEqual([5000, 10_000, 11_001]);
    const flaky = reader('flojo', 'bul', 'FORMATO A', 'if (block.start > 0) return [];');
    expect((await run(job(path, { readers: [flaky] }))).at(-1)).toEqual({
      type: 'failed',
      reason: 'reader-failed',
    });
  });

  it('price-lists-R5.4: un código repetido en otro bloque se saltea', async () => {
    const rows: Rows = [
      ['FORMATO A'],
      ...Array.from({ length: 5000 }, (_, i) => [`C${i}`, 'x', 1]),
      ['C7', 'otra vez', 2],
    ];
    const sent = await run(
      job(saved(xlsx(rows)), { readers: [reader('bueno', 'bul', 'FORMATO A')] }),
    );
    expect(sent.at(-2)).toMatchObject({
      type: 'block',
      products: [{ code: 'C4999' }],
      skipped: [{ code: 'C7', reason: 'repeated-code' }],
    });
  });

  it('price-lists-E46 y R5.5: el automático duda con dos precios o si casi nada es un producto; sin encabezado, nadie la entiende', async () => {
    const two = saved(
      xlsx([
        ['Código', 'Descripción', 'Precio s/IVA', 'Precio c/IVA'],
        ['A', 'B', 1, 2],
      ]),
    );
    expect((await run(job(two))).at(-1)).toEqual({ type: 'failed', reason: 'auto-unsure' });
    const none = saved(xlsx([['Hola', 'Mundo']]));
    expect((await run(job(none))).at(-1)).toEqual({ type: 'failed', reason: 'no-reader' });
    const words = saved(
      xlsx([
        ['Código', 'Descripción', 'Precio'],
        ['A', 'B', 'consultar'],
        ['C', 'D', 'consultar'],
      ]),
    );
    expect((await run(job(words))).at(-1)).toEqual({ type: 'failed', reason: 'auto-unsure' });
    const odd = saved(
      xlsx([
        ['Código', 'Descripción', 'Precio'],
        ['A', 'B', 10],
      ]),
    );
    const wrong = { ...job(odd), autoCode: 'globalThis.reader = { read: () => [] };' };
    expect((await run(wrong)).at(-1)).toEqual({ type: 'failed', reason: 'auto-unsure' });
  });
});
