// El costo de las filas de una lista y qué le pasa a cada una (08 · R3.3, R6.2).
import { initialTerms } from '@ferrebress/shared/contracts/price-lists';
import { describe, expect, it } from 'vitest';
import { priced } from './pricing.ts';

const row = (code: string, listPrice: bigint, vat: number | null = null) => ({
  ...{ sheet: 0, row: 1, code, listPrice, vat, brand: null },
});

describe('el costo de las filas', () => {
  it('price-lists-E54 y E63: nuevo, cambia o igual, frente al costo que tenía su artículo', () => {
    const previous = new Map([
      ['A', 100n],
      ['B', 50n],
    ]);
    const terms = { ...initialTerms(), vatIncluded: true };
    const out = priced(
      [row('A', 121n, 210), row('B', 121n, 210), row('C', 110n)],
      previous,
      terms,
      { id: 'l', date: null },
    );
    expect(out.map(({ cost, previous: before, change }) => [cost, before, change])).toEqual([
      [100n, 100n, 'same'],
      [100n, 50n, 'changed'],
      [90n, null, 'new'],
    ]);
    expect(out[0]?.basis).toMatchObject({ vat: 210, listId: 'l', listDate: null });
  });
});

describe('cómo se muestra una fila del detalle', () => {
  it('con todo lo que tiene, y una salteada solo con lo que traía', async () => {
    const { rowOf } = await import('./review.ts');
    const base = { at: 0, sheet: 0, row: 1, code: 'A1', description: 'Mecha', basis: null };
    expect(
      rowOf({
        ...base,
        brand: 'Bremen',
        change: 'changed',
        cost: '2',
        previous: '1',
        variation: 100,
        skipped: null,
        cells: null,
      }),
    ).toEqual({
      code: 'A1',
      description: 'Mecha',
      brand: 'Bremen',
      change: 'changed',
      cost: '2',
      previous: '1',
      variation: 100,
    });
    expect(
      rowOf({
        ...base,
        brand: null,
        change: null,
        cost: null,
        previous: null,
        variation: null,
        skipped: 'no-price',
        cells: ['A1'],
      }),
    ).toEqual({ code: 'A1', description: 'Mecha', skipped: 'no-price', cells: ['A1'] });
  });
});
