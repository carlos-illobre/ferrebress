import { describe, expect, it } from 'vitest';
import { roundUp } from './rounding.ts';

describe('el redondeo para arriba, en centavos (06 · R3.1)', () => {
  it('administration-E15: con $ 1.000, 15.001 pasa a 16.000 y 15.000 queda igual', () => {
    expect(roundUp(1_500_100n, 100_000)).toBe(1_600_000n);
    expect(roundUp(1_500_000n, 100_000)).toBe(1_500_000n);
    expect(roundUp(1_500_001n, 100_000)).toBe(1_600_000n);
  });

  it('administration-E16: con $ 50, 1.201 pasa a 1.250', () => {
    expect(roundUp(120_100n, 5000)).toBe(125_000n);
  });

  it('administration-E17: sin redondeo (un centavo), queda igual', () => {
    expect(roundUp(120_150n, 1)).toBe(120_150n);
  });

  it('07-E07: con $ 0,05, $ 10,12 pasa a $ 10,15', () => {
    expect(roundUp(1012n, 5)).toBe(1015n);
  });
});
