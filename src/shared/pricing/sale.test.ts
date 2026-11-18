import { describe, expect, it } from 'vitest';
import { rawCents, salePrice } from './sale.ts';

const pesos = (n: number) => BigInt(n) * 1_000_000n;

describe('el precio de venta (07 · R2.2)', () => {
  it('catalog-E06: costo $ 1.500, margen 100 %, IVA 21 % y paso $ 1.000: $ 3.630 se cobra $ 4.000', () => {
    expect(salePrice(pesos(1500), 100, 210, 100_000)).toEqual({
      cost: pesos(1500),
      withMargin: 300_000n,
      raw: 363_000n,
      stepCents: 100_000,
      sale: 400_000n,
    });
  });

  it('catalog-E07: con $ 0,05, $ 10,12 se cobra $ 10,15', () => {
    // Un costo que con el IVA da $ 10,12, sin margen para que la cuenta se vea.
    const cost = 8_363_636n;
    expect(rawCents(cost, 0, 210)).toBe(1012n);
    expect(salePrice(cost, 0, 210, 5).sale).toBe(1015n);
  });

  it('catalog-E08: sin redondeo, $ 10,123 se cobra $ 10,13', () => {
    // 10,123 / 1,21 = 8,366115…
    const cost = 8_366_116n;
    expect(rawCents(cost, 0, 210)).toBe(1013n);
    expect(salePrice(cost, 0, 210, 1).sale).toBe(1013n);
  });

  it('un precio que ya es justo no sube un centavo', () => {
    expect(rawCents(pesos(100), 50, 105)).toBe(16_575n);
  });
});
