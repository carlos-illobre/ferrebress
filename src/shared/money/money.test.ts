import { describe, expect, it } from 'vitest';
import { centsOf, centsText, formatPesos, microOf, priceText, stepText } from './money.ts';

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

  it('administration-R3.6, 07-R2.3: un precio con los decimales del paso', () => {
    expect(priceText(1_600_000n, 100_000)).toBe('$ 16.000');
    expect(priceText(120_140n, 10)).toBe('$ 1.201,4');
    expect(priceText(1015n, 5)).toBe('$ 10,15');
    expect(priceText(1013n, 1)).toBe('$ 10,13');
    expect(priceText(-500n, 100)).toBe('−$ 5');
    expect(centsText(363_000n)).toBe('$ 3.630,00');
  });

  it('los pasos del redondeo', () => {
    expect(stepText(5)).toBe('$ 0,05');
    expect(stepText(10)).toBe('$ 0,10');
    expect(stepText(100_000)).toBe('$ 1.000');
  });
});
