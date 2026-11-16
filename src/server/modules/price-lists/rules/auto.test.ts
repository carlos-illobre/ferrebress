// El lector automático (08 · R5.3, R5.5): encontrar el encabezado, y su plantilla leyendo encerrada en
// QuickJS, con la marca del renglón de arriba.
import { readFileSync } from 'node:fs';
import type { Block, Cell, Head } from '@ferrebress/shared/contracts/price-lists';
import { describe, expect, it } from 'vitest';
import { runReader } from '../reading/sandbox.ts';
import { autoDoubts, detectAuto } from './auto.ts';

const template = readFileSync(new URL('../readers/auto-1.js', import.meta.url), 'utf8');
const limits = { memoryBytes: 64 * 2 ** 20, stackBytes: 2 ** 20, timeMs: 5000 };
const cells = (...values: (string | number | null)[]): Cell[] =>
  values.map((v) => (v === null ? null : { v, t: String(v) }));

// E42: el encabezado en la primera fila y renglones sueltos con la marca.
const plain: Head = [
  {
    name: 'Lista',
    rows: [
      cells('Código', 'Descripción', 'Precio Unitario'),
      cells(null, 'BREMEN'),
      cells('B1', 'Mecha 6 mm', 1200),
      cells('B2', 'Mecha 8 mm', 1500),
      [],
      cells('FISCHER'),
      cells('F1', 'Tarugo 8', 300),
    ],
  },
];

describe('el lector automático', () => {
  it('price-lists-E42: encuentra el encabezado por sus nombres', () => {
    expect(detectAuto(plain)).toEqual({
      columns: { code: 0, description: 1, price: 2 },
      labels: { code: 'codigo', description: 'descripcion', price: 'precio unitario' },
    });
  });

  it('price-lists-E43: con filas de título antes del encabezado, y «Artículo» como código o descripción', () => {
    const titled: Head = [
      {
        name: 'Hoja',
        rows: [
          ...Array.from({ length: 7 }, (_, i) => cells(`Título ${i}`)),
          cells('Artículo', 'Detalle', 'Marca', 'IVA', 'Lista'),
        ],
      },
    ];
    expect(detectAuto(titled)).toMatchObject({
      columns: { code: 0, description: 1, brand: 2, vat: 3, price: 4 },
    });
    const both: Head = [{ name: 'H', rows: [cells('Cód.', 'Artículo', 'Precio')] }];
    expect(detectAuto(both)).toMatchObject({ columns: { code: 0, description: 1, price: 2 } });
    const three: Head = [
      { name: 'H', rows: [cells('Código', 'Descripción', 'Artículo', 'Precio')] },
    ];
    expect(detectAuto(three)).toMatchObject({ columns: { code: 0, description: 1, price: 3 } });
  });

  it('price-lists-E46: con dos columnas de precio duda; sin encabezado, no la reconoce', () => {
    const two: Head = [
      { name: 'H', rows: [cells('Código', 'Descripción', 'Precio s/IVA', 'Precio c/IVA')] },
    ];
    expect(detectAuto(two)).toBe('unsure');
    expect(detectAuto([{ name: 'H', rows: [cells('Hola', 'Mundo')] }])).toBe('no');
    expect(autoDoubts(0, 0)).toBe(true);
    expect(autoDoubts(3, 4)).toBe(true);
    expect(autoDoubts(10, 1)).toBe(false);
  });

  it('price-lists-E42: su plantilla, encerrada, lee cada producto con la marca del renglón de arriba', async () => {
    const params = detectAuto(plain);
    expect(await runReader(template, params, 'recognizes', [plain], limits)).toEqual({ ok: 'yes' });
    const other: Head = [{ name: 'H', rows: [cells('Otra', 'Cosa')] }];
    expect(await runReader(template, params, 'recognizes', [other], limits)).toEqual({ ok: 'no' });
    const block: Block = { sheet: 0, start: 0, rows: plain[0]?.rows ?? [], before: [] };
    const read = await runReader(template, params, 'read', [block, plain], limits);
    expect(read).toEqual({
      ok: [
        { row: 0, kind: 'title' },
        { row: 1, kind: 'brand' },
        {
          row: 2,
          kind: 'product',
          at: { code: [2, 0], description: [2, 1], price: [2, 2], brand: [1, 1] },
        },
        {
          row: 3,
          kind: 'product',
          at: { code: [3, 0], description: [3, 1], price: [3, 2], brand: [1, 1] },
        },
        { row: 4, kind: 'empty' },
        { row: 5, kind: 'brand' },
        {
          row: 6,
          kind: 'product',
          at: { code: [6, 0], description: [6, 1], price: [6, 2], brand: [5, 0] },
        },
      ],
    });
  });

  it('en un bloque que no es el primero, la marca sale de las filas de antes; las columnas de marca, IVA y barras van solas', async () => {
    const head: Head = [
      { name: 'H', rows: [cells('Código', 'Descripción', 'Marca', 'IVA', 'EAN', 'Precio')] },
    ];
    const params = detectAuto(head);
    const block: Block = {
      sheet: 0,
      start: 3,
      before: [
        head[0]?.rows[0] ?? [],
        cells('ACME'),
        cells('Código', 'Descripción', 'Marca', 'IVA', 'EAN', 'Precio'),
      ],
      rows: [
        cells('X', 'Clavo', null, '21', '779', 10),
        cells('Y', 'Tornillo', 'Otra', null, null, 5),
      ],
    };
    const read = await runReader(template, params, 'read', [block, head], limits);
    expect(read).toEqual({
      ok: [
        {
          row: 3,
          kind: 'product',
          at: {
            code: [3, 0],
            description: [3, 1],
            price: [3, 5],
            brand: [1, 0],
            vat: [3, 3],
            barcode: [3, 4],
          },
        },
        {
          row: 4,
          kind: 'product',
          at: {
            code: [4, 0],
            description: [4, 1],
            price: [4, 5],
            brand: [4, 2],
            vat: [4, 3],
            barcode: [4, 4],
          },
        },
      ],
    });
    const lost: Block = { sheet: 0, start: 0, rows: [cells('Z', 'Sin encabezado', 1)], before: [] };
    const noHeader: Head = [{ name: 'H', rows: [cells('Z', 'Sin encabezado', 1)] }];
    expect(await runReader(template, params, 'read', [lost, noHeader], limits)).toEqual({
      ok: [{ row: 0, kind: 'title' }],
    });
  });
});
