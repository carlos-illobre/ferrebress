import { describe, expect, it } from 'vitest';
import { roundUp } from './rounding.ts';

describe('el redondeo para arriba (06 · R3.1)', () => {
  it('administration-E15: con $ 1.000, 15.001 pasa a 16.000 y 15.000 queda igual', () => {
    expect(roundUp(15_001, 1000)).toBe(16_000);
    expect(roundUp(15_000, 1000)).toBe(15_000);
    expect(roundUp(15_000.01, 1000)).toBe(16_000);
  });

  it('administration-E16: con $ 50, 1.201 pasa a 1.250', () => {
    expect(roundUp(1201, 50)).toBe(1250);
  });

  it('administration-E17: sin redondeo, queda igual', () => {
    expect(roundUp(1201, 0)).toBe(1201);
    expect(roundUp(1201.5, 0)).toBe(1201.5);
  });

  it('un precio con centavos que la coma flotante corre no salta de múltiplo', () => {
    expect(roundUp(0.1 + 0.2, 10)).toBe(10);
    expect(roundUp(1000.0000001, 1000)).toBe(1000);
  });
});
