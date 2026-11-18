// La comprobación de lo que devuelve un lector (08 · R5.4, E48, E49; diseño de 08, § 4).
import type { Block, Cell, SheetRows } from '@ferrebress/shared/contracts/price-lists';
import { describe, expect, it } from 'vitest';
import { checkBlock } from './check.ts';

const cells = (...values: (string | number | null)[]): Cell[] =>
  values.map((v) => (v === null ? null : { v, t: String(v) }));
const product = (row: number, more: object = {}) => ({
  row,
  kind: 'product',
  at: { code: [row, 0], description: [row, 1], price: [row, 2], ...more },
});

// E49: una fila sin precio, otra con 0, otra «a consultar», un código repetido y una en dólares.
const rows: SheetRows = [
  cells('BREMEN'),
  cells('A1', 'Mecha 6 mm', '$ 1.200,50', '21 %', '7790001'),
  cells('A2', 'Mecha 8 mm', null),
  cells('A3', 'Mecha 10 mm', 0),
  cells('A4', 'Mecha 12 mm', 'a consultar'),
  cells('A1', 'Mecha repetida', 100),
  cells('A5', 'Mecha 14 mm', 'US$ 3'),
  cells(null, 'Sin código', 100),
  cells('A6', null, 100),
  [],
];
const block: Block = { sheet: 0, start: 0, rows, before: [] };
const output = [
  { row: 0, kind: 'brand' },
  product(1, { brand: [0, 0], vat: [1, 3], barcode: [1, 4] }),
  ...[2, 3, 4, 5, 6, 7, 8].map((row) => product(row)),
  { row: 9, kind: 'empty' },
];

describe('la comprobación', () => {
  it('price-lists-E49: cada fila termina como producto o como salteada con su motivo', () => {
    const checked = checkBlock(block, output, new Set());
    expect(checked).toEqual({
      products: [
        {
          sheet: 0,
          row: 1,
          code: 'A1',
          description: 'Mecha 6 mm',
          brand: 'BREMEN',
          barcode: '7790001',
          listPrice: 1_200_500_000n,
          vat: 210,
          searchKey: 'a1 mecha 6 mm bremen',
        },
      ],
      skipped: [
        {
          sheet: 0,
          row: 2,
          reason: 'no-price',
          code: 'A2',
          description: 'Mecha 8 mm',
          cells: ['A2', 'Mecha 8 mm', ''],
        },
        {
          sheet: 0,
          row: 3,
          reason: 'zero-price',
          code: 'A3',
          description: 'Mecha 10 mm',
          cells: ['A3', 'Mecha 10 mm', '0'],
        },
        expect.objectContaining({ row: 4, reason: 'not-a-number' }),
        expect.objectContaining({ row: 5, reason: 'repeated-code', code: 'A1' }),
        expect.objectContaining({ row: 6, reason: 'other-currency' }),
        expect.objectContaining({
          row: 7,
          reason: 'no-code',
          code: null,
          description: 'Sin código',
        }),
        expect.objectContaining({
          row: 8,
          reason: 'no-description',
          code: 'A6',
          description: null,
        }),
      ],
    });
  });

  it('un código repetido en otro bloque de la misma lista también se saltea', () => {
    const seen = new Set(['A1']);
    const one: Block = { sheet: 0, start: 1, rows: [rows[1] ?? []], before: [] };
    expect(checkBlock(one, [product(1)], seen)).toMatchObject({
      products: [],
      skipped: [{ reason: 'repeated-code' }],
    });
  });

  it('una fila que el lector saltea queda con su motivo; sin motivo, sin precio', () => {
    const one: Block = { sheet: 0, start: 1, rows: [rows[1] ?? []], before: [] };
    expect(
      checkBlock(one, [{ row: 1, kind: 'skipped', reason: 'other-currency' }], new Set()),
    ).toMatchObject({
      skipped: [
        { reason: 'other-currency', cells: ['A1', 'Mecha 6 mm', '$ 1.200,50', '21 %', '7790001'] },
      ],
    });
    expect(checkBlock(one, [{ row: 1, kind: 'product' }], new Set())).toMatchObject({
      skipped: [{ reason: 'no-price' }],
    });
  });

  it('una fila salteada viaja con lo que alcanza para mostrarla: 50 celdas de 200 letras', () => {
    const wide = Array.from({ length: 10_000 }, () => ({
      v: 'x'.repeat(60_000),
      t: 'x'.repeat(60_000),
    }));
    const one: Block = { sheet: 0, start: 1, rows: [wide], before: [] };
    const checked = checkBlock(one, [{ row: 1, kind: 'skipped', reason: 'no-price' }], new Set());
    const cells = 'skipped' in checked ? (checked.skipped[0]?.cells ?? []) : [];
    expect(cells).toHaveLength(50);
    expect(cells.every((cell) => cell.length === 200)).toBe(true);
  });

  it('una celda de las filas de antes del bloque vale (una marca arriba); una más arriba no existe', () => {
    const later: Block = { sheet: 0, start: 1, rows: [rows[1] ?? []], before: [rows[0] ?? []] };
    expect(checkBlock(later, [product(1, { brand: [0, 0] })], new Set())).toMatchObject({
      products: [{ code: 'A1', brand: 'BREMEN' }],
    });
    const away: Block = { sheet: 0, start: 2, rows: [rows[2] ?? []], before: [rows[1] ?? []] };
    expect(checkBlock(away, [product(2, { brand: [0, 0] })], new Set())).toEqual({
      problem: 'bad-cell',
    });
  });

  it('un código, una descripción o una marca muy largos', () => {
    const long: SheetRows = [cells('X'.repeat(61), 'Ok', 1), cells('B', 'D'.repeat(400), 1)];
    const both: Block = { sheet: 0, start: 0, rows: long, before: [] };
    const checked = checkBlock(both, [product(0), product(1)], new Set());
    expect(checked).toMatchObject({
      skipped: [{ reason: 'no-code' }],
      products: [{ code: 'B', description: 'D'.repeat(300) }],
    });
  });

  it('price-lists-E48: lo que no tiene la forma, deja filas sin clase o señala una celda que no existe no pasa', () => {
    expect(checkBlock(block, 'nada', new Set())).toEqual({ problem: 'bad-output' });
    expect(checkBlock(block, [{ row: 0, kind: 'otra' }], new Set())).toEqual({
      problem: 'bad-output',
    });
    expect(checkBlock(block, output.slice(1), new Set())).toEqual({
      problem: 'missing-rows',
    });
    expect(checkBlock(block, [...output.slice(1), { row: 99, kind: 'empty' }], new Set())).toEqual({
      problem: 'missing-rows',
    });
    const away = [...output.slice(0, 9), product(9, { price: [500, 2] })];
    expect(checkBlock(block, away, new Set())).toEqual({ problem: 'bad-cell' });
  });
});
