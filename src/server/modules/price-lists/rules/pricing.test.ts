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
