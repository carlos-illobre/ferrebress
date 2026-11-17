// Los cambios a cómo cobra, en sus bordes: el porcentaje escrito, un descuento que no vale y mover el
// primero o el último.
import type { Terms } from '@ferrebress/shared/contracts/price-lists';
import { describe, expect, it } from 'vitest';
import { discountOf, moved, percentOf } from './terms-rules.ts';

const terms: Terms = {
  vatIncluded: false,
  discounts: [
    { id: 'a', name: 'A', percent: 100, brand: null },
    { id: 'b', name: 'B', percent: 200, brand: null },
  ],
  defaultVat: 210,
  onChange: 'next',
};

describe('cómo cobra, en los bordes', () => {
  it('el porcentaje: con coma o punto, hasta dos decimales, mayor que 0 y menor que 100', () => {
    expect(percentOf('2,5')).toBe(250);
    expect(percentOf('99.99')).toBe(9999);
    expect(percentOf('0')).toBeUndefined();
    expect(percentOf('100')).toBeUndefined();
    expect(percentOf('1,234')).toBeUndefined();
    expect(percentOf('')).toBeUndefined();
  });

  it('un descuento sin nombre, con un nombre o una marca de más, no vale', () => {
    expect(discountOf({ name: ' ', percent: '5', brand: '' }, 'x')).toBeUndefined();
    expect(discountOf({ name: 'x'.repeat(41), percent: '5', brand: '' }, 'x')).toBeUndefined();
    expect(discountOf({ name: 'A', percent: '5', brand: 'x'.repeat(81) }, 'x')).toBeUndefined();
  });

  it('el primero no sube, el último no baja, y uno que no está no se mueve', () => {
    expect(moved(terms, 'a', -1)).toBe(terms);
    expect(moved(terms, 'b', 1)).toBe(terms);
    expect(moved(terms, 'z', 1)).toBe(terms);
  });
});
