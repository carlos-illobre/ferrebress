// El lector automático por lo que hay en cada columna (08 · R5.3): el dato que el encabezado no nombra.
import { readFileSync } from 'node:fs';
import type { Block, Cell, Head } from '@ferrebress/shared/contracts/price-lists';
import { describe, expect, it } from 'vitest';
import { runReader } from '../reading/sandbox.ts';
import { detectAuto } from './auto.ts';

const template = readFileSync(new URL('../readers/auto-1.js', import.meta.url), 'utf8');
const limits = { memoryBytes: 64 * 2 ** 20, stackBytes: 2 ** 20, timeMs: 5000 };
const cells = (...values: (string | number | null)[]): Cell[] =>
  values.map((v) => (v === null ? null : { v, t: String(v) }));
const sheet = (...rows: Cell[][]): Head => [{ name: 'H', rows }];
const products = [
  cells('B1', 'Mecha 6 mm', 1200),
  cells('B2', 'Mecha 8 mm', 1500),
  cells('B3', 'Tarugo de 8', 300),
];

describe('el lector automático, por lo que hay en cada columna', () => {
  it('price-lists-R5.3: el dato que el encabezado no nombra sale de lo que hay debajo', () => {
    // Sin nombre para la descripción: la columna de textos con espacios.
    expect(detectAuto(sheet(cells('Código', 'Art.', 'Precio'), ...products))).toEqual({
      columns: { code: 0, price: 2, description: 1 },
      labels: { code: 'codigo', price: 'precio', description: 'art' },
    });
    // Sin nada arriba del código.
    expect(detectAuto(sheet(cells(null, 'Descripción', 'Precio'), ...products))).toMatchObject({
      columns: { code: 0, description: 1, price: 2 },
      labels: { code: '' },
    });
    // El precio, en una columna que el encabezado ni tiene: su nombre, vacío.
    expect(detectAuto(sheet(cells('Código', 'Descripción'), ...products))).toMatchObject({
      columns: { price: 2 },
      labels: { price: '' },
    });
    // Sin nombre para el precio: la única columna con números.
    expect(detectAuto(sheet(cells('Código', 'Descripción', 'Neto'), ...products))).toMatchObject({
      columns: { price: 2 },
    });
  });

  it('price-lists-E46: dos columnas que parecen precio dudan; ninguna, o un solo nombre, no es encabezado', () => {
    const two = [cells('B1', 'Mecha 6 mm', 10, 12), cells('B2', 'Mecha 8 mm', 20, 24)];
    expect(detectAuto(sheet(cells('Código', 'Descripción', 'A', 'B'), ...two))).toBe('unsure');
    const texts = [cells('B1', 'Mecha 6 mm', 'x'), cells('B2', 'Mecha 8 mm', 'y')];
    expect(detectAuto(sheet(cells('Código', 'Descripción', 'Nota'), ...texts))).toBe('no');
    expect(detectAuto(sheet(cells('Lista de precios'), ...products))).toBe('no');
  });

  it('su plantilla reconoce el encabezado con la celda vacía y lee los productos', async () => {
    const head = sheet(cells(null, 'Descripción', 'Precio'), ...products);
    const params = detectAuto(head);
    expect(await runReader(template, params, 'recognizes', [head], limits)).toEqual({ ok: 'yes' });
    const block: Block = { sheet: 0, start: 0, rows: head[0]?.rows ?? [], before: [] };
    const read = (await runReader(template, params, 'read', [block, head], limits)) as {
      ok: { kind: string }[];
    };
    expect(read.ok.map((row) => row.kind)).toEqual(['title', 'product', 'product', 'product']);
  });
});
