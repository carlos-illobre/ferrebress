// Leer un precio, un IVA y un texto de una celda (08 · R5.4; diseño de 08, § 4).
import { describe, expect, it } from 'vitest';
import { priceOf, textOf, vatOf } from './cells.ts';

const text = (t: string) => ({ v: t, t });
const number = (v: number, t = String(v)) => ({ v, t });

describe('leer una celda', () => {
  it('un precio escrito como número o como texto, en millonésimos', () => {
    expect(priceOf(number(2314))).toEqual({ price: 2_314_000_000n });
    expect(priceOf(number(1735.5, '$ 1.735,50'))).toEqual({ price: 1_735_500_000n });
    expect(priceOf(text('$ 2.314,00'))).toEqual({ price: 2_314_000_000n });
    expect(priceOf(text('1.234,5'))).toEqual({ price: 1_234_500_000n });
    expect(priceOf(text('1.234'))).toEqual({ price: 1_234_000_000n });
    expect(priceOf(text('2314.5'))).toEqual({ price: 2_314_500_000n });
    expect(priceOf(text('0,0000015'))).toEqual({ price: 1n });
  });

  it('price-lists-E49: sin precio, cero o negativo, que no es un número y en otra moneda', () => {
    expect(priceOf(null)).toEqual({ skipped: 'no-price' });
    expect(priceOf(undefined)).toEqual({ skipped: 'no-price' });
    expect(priceOf(text('  '))).toEqual({ skipped: 'no-price' });
    expect(priceOf(number(0))).toEqual({ skipped: 'zero-price' });
    expect(priceOf(text('-15,00'))).toEqual({ skipped: 'zero-price' });
    expect(priceOf(text('a consultar'))).toEqual({ skipped: 'not-a-number' });
    expect(priceOf(text('1,234.50'))).toEqual({ skipped: 'not-a-number' });
    expect(priceOf(number(Number.NaN, 'NaN'))).toEqual({ skipped: 'not-a-number' });
    expect(priceOf(number(2e12))).toEqual({ skipped: 'not-a-number' });
    expect(priceOf(text('US$ 10,00'))).toEqual({ skipped: 'other-currency' });
    expect(priceOf(number(10, 'U$S 10'))).toEqual({ skipped: 'other-currency' });
  });

  it('price-lists-E26: el IVA, en décimos, como lo escriba la lista', () => {
    expect(vatOf(text('21 %'))).toBe(210);
    expect(vatOf(text('10,5'))).toBe(105);
    expect(vatOf(number(0.21))).toBe(210);
    expect(vatOf(number(27))).toBe(270);
    expect(vatOf(text('IVA 0%'))).toBe(0);
    for (const odd of [text('exento'), text(''), number(-1), number(150), number(21.04), null])
      expect(vatOf(odd)).toBeNull();
  });

  it('price-lists-E68: el texto sin caracteres de control ni los que lo dan vuelta', () => {
    const [nul, reverse] = [String.fromCharCode(0), String.fromCharCode(0x202e)];
    expect(textOf(text(`  Tornillo${nul} ${reverse}10\tmm  `))).toBe('Tornillo 10 mm');
    expect(textOf(null)).toBe('');
    // Una mitad suelta (&#xD800; en el XML): la base no la guarda y se perdería el bloque.
    expect(textOf(text(`Tornillo ${String.fromCharCode(0xd800)}10`))).toBe('Tornillo 10');
  });
});
