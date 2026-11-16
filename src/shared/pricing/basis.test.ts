// La base de un costo (08 · R3.4, R3.5): la cuenta paso a paso y rehacerla con cómo cobra ahora.
import { describe, expect, it } from 'vitest';
import { costWith, recompute, stepsOf } from './basis.ts';

const row = {
  listPrice: 2_314_000_000n,
  vat: 210,
  brand: ' Bremen ',
  listId: 'l1',
  listDate: '2026-08-14',
};
const general = { id: 'g', name: 'General', percent: 2500, brand: null };
const bremen = { id: 'b', name: 'Bremen', percent: 1000, brand: 'BREMEN' };

describe('la base de un costo', () => {
  it('price-lists-E17: la cuenta paso a paso, con la lista y su fecha', () => {
    const { cost, basis } = costWith(row, { vatIncluded: false, discounts: [general] });
    expect(cost).toBe(1_735_500_000n);
    expect(basis).toEqual({
      listPrice: '2314000000',
      vatIncluded: false,
      vat: 210,
      brand: 'bremen',
      discounts: [{ name: 'General', percent: 2500 }],
      listId: 'l1',
      listDate: '2026-08-14',
    });
    expect(stepsOf(basis)).toEqual([
      { kind: 'list', amount: 2_314_000_000n },
      { kind: 'discount', name: 'General', percent: 2500, amount: 1_735_500_000n },
    ]);
  });

  it('price-lists-E19 y R3.5: rehecha con lo nuevo, con la misma marca, el mismo IVA y la misma lista', () => {
    const { basis } = costWith(row, { vatIncluded: false, discounts: [] });
    const again = recompute(basis, { vatIncluded: true, discounts: [bremen] });
    expect(again.basis).toMatchObject({
      vatIncluded: true,
      vat: 210,
      brand: 'bremen',
      listId: 'l1',
    });
    expect(again.basis.discounts).toEqual([{ name: 'Bremen', percent: 1000 }]);
    expect(again.cost).toBe(1_721_157_024n);
  });

  it('sin marca, o con una marca vacía, solo le tocan los descuentos para todas', () => {
    for (const brand of [null, '  '])
      expect(
        costWith({ ...row, brand }, { vatIncluded: false, discounts: [bremen] }).basis,
      ).toMatchObject({
        brand: null,
        discounts: [],
      });
  });
});
