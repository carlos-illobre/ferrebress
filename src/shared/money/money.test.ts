import { describe, expect, it } from 'vitest';
import { centsOf, formatPesos, microOf } from './money.ts';

describe('la plata en millonésimos', () => {
  it('08 · E17, E18: se muestra redondeada al centavo, la mitad para arriba', () => {
    expect(formatPesos(1_648_725_000n)).toBe('$ 1.648,73');
    expect(formatPesos(826_446_280n)).toBe('$ 826,45');
    expect(formatPesos(2_314_000_000n)).toBe('$ 2.314,00');
    expect(formatPesos(1_234_567_890_000n)).toBe('$ 1.234.567,89');
    expect(formatPesos(0n)).toBe('$ 0,00');
  });

  it('los negativos, como una diferencia que baja', () => {
    expect(centsOf(-1_005_000n)).toBe(-101n);
    expect(formatPesos(-1_648_725_000n)).toBe('−$ 1.648,73');
  });

  it('pesos escritos como número, a millonésimos', () => {
    expect(microOf('2314')).toBe(2_314_000_000n);
    expect(microOf('1735.5')).toBe(1_735_500_000n);
    expect(microOf('0.1234567')).toBe(123_456n);
  });
});
