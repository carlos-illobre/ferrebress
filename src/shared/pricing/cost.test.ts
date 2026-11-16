import { describe, expect, it } from 'vitest';
import { costOf, type Discount, discountsFor } from './cost.ts';

const general: Discount = { id: 'g', name: 'General', percent: 2_500, brand: null };
const cash: Discount = { id: 'c', name: 'Contado', percent: 500, brand: null };

describe('la cuenta del costo (08 · R3.3)', () => {
  it('E17: precio de lista $ 2.314, general 25 % y contado 5 %: $ 1.648,725, paso a paso', () => {
    const { cost, steps } = costOf({
      listPrice: 2_314_000_000n,
      vatIncluded: false,
      vat: 210,
      discounts: [general, cash],
    });
    expect(cost).toBe(1_648_725_000n);
    expect(steps).toEqual([
      { kind: 'list', amount: 2_314_000_000n },
      { kind: 'discount', name: 'General', percent: 2_500, amount: 1_735_500_000n },
      { kind: 'discount', name: 'Contado', percent: 500, amount: 1_648_725_000n },
    ]);
  });

  it('E18: con IVA incluido, $ 1.000 con 21 % queda en $ 826,446280, sin redondear', () => {
    const { cost, steps } = costOf({
      listPrice: 1_000_000_000n,
      vatIncluded: true,
      vat: 210,
      discounts: [],
    });
    expect(cost).toBe(826_446_280n);
    expect(steps[1]).toEqual({ kind: 'vat', vat: 210, amount: 826_446_280n });
  });

  it('E92: un descuento con decimales (2,5 %)', () => {
    const { cost } = costOf({
      listPrice: 1_000_000_000n,
      vatIncluded: false,
      vat: 210,
      discounts: [{ name: 'Pronto pago', percent: 250 }],
    });
    expect(cost).toBe(975_000_000n);
  });

  it('un costo enorme no pierde precisión', () => {
    const { cost } = costOf({
      listPrice: 999_999_999_999_000_000n,
      vatIncluded: false,
      vat: 210,
      discounts: [{ name: 'Casi todo', percent: 9_999 }],
    });
    expect(cost).toBe(99_999_999_999_900n);
  });

  it('E19: un descuento de una marca vale para esa marca, sin distinguir mayúsculas', () => {
    const bremen: Discount = { id: 'b', name: 'Bremen', percent: 1_000, brand: 'bremen' };
    expect(discountsFor([general, bremen], 'bremen')).toEqual([general, bremen]);
    expect(discountsFor([general, bremen], 'otra')).toEqual([general]);
    expect(discountsFor([general, bremen], null)).toEqual([general]);
  });
});
