// Lo que muestra ver qué cambia, en sus bordes: sin proveedor ni fecha ni quién la subió, solo
// cambios, de a uno, una variación que baja y aplicándose sin avance todavía.
import type { ListState, ListSummary } from '@ferrebress/shared/contracts/price-lists';
import { describe, expect, it } from 'vitest';
import { chipsOf, headerOf, rowLines, stepsLines, viewOf } from './rules.ts';

const one: ListSummary = {
  ...{ new: 1, changed: 1, same: 1, gone: 1, skipped: 1, reasons: {} },
  ...{ averageChange: null, review: 1, goneWarning: false, tooOld: false },
};
const bare: ListState = {
  ...{ id: 'l', status: 'applying', rowsRead: 0, fileName: 'a.csv', scope: 'partial' },
  ...{ uploadedAt: new Date().toISOString(), file: true },
};

describe('ver qué cambia, en los bordes', () => {
  it('sin proveedor, sin fecha, sin quién la subió, solo cambios', () => {
    expect(headerOf(bare)).toMatchObject({
      supplier: 'Sin proveedor todavía',
      date: 'Sin fecha',
      scope: 'Solo cambios: no da de baja nada',
      uploaded: 'La subió alguien recién',
    });
  });

  it('de a uno, en singular; sin promedio; solo cambios no ofrece las bajas; el elegido sin ninguno sigue', () => {
    expect(chipsOf(one, null, true).map((chip) => chip.label)).toEqual([
      '1 para revisar',
      '1 nuevo',
      '1 cambia de costo',
      '1 queda igual',
      '1 fila salteada',
    ]);
    expect(chipsOf({ ...one, new: 0 }, 'new', false).find((chip) => chip.value === 'new')).toEqual({
      value: 'new',
      label: '0 nuevos',
      pressed: true,
      urgent: false,
    });
    expect(chipsOf(one, null, false).map((chip) => chip.label)).toContain('1 ya no viene');
  });

  it('aplicándose sin avance todavía, sin resumen; aplicar de a uno en singular', () => {
    expect(viewOf(bare, undefined, null)).toMatchObject({
      chips: [],
      applyLabel: undefined,
      applying: 'Aplicando: 0 filas',
    });
    expect(viewOf({ ...bare, status: 'pending', summary: one }, undefined, null).applyLabel).toBe(
      'Aplicar: 1 nuevo, 1 costo, 1 baja',
    );
    expect(
      viewOf(
        { ...bare, status: 'applied', result: { created: 1, changed: 1, gone: 1, restored: 0 } },
        undefined,
        null,
      ).applied,
    ).toBe('Aplicada: 1 producto creado, 1 costo cambiado, 1 dado de baja.');
  });

  it('una variación que baja, y una fila sin código ni descripción', () => {
    expect(
      rowLines({
        code: null,
        description: null,
        previous: '2000000',
        cost: '1000000',
        variation: -50,
      }),
    ).toMatchObject({
      code: '',
      description: '',
      variation: '-50 %',
    });
    expect(rowLines({ code: 'x', description: 'y', skipped: 'no-price' }).cells).toBe('');
  });

  it('price-lists-E17: la cuenta, paso a paso; sin fecha de la lista, sin su renglón', () => {
    const basis = {
      ...{ listPrice: '2314000000', vatIncluded: false, vat: 210, brand: null, listId: 'l' },
      discounts: [
        { name: 'General', percent: 2500 },
        { name: 'Contado', percent: 500 },
      ],
    };
    expect(stepsLines({ ...basis, listDate: null })).toEqual([
      'Precio de lista $ 2.314,00',
      '− 25 % General = $ 1.735,50',
      '− 5 % Contado = $ 1.648,73',
    ]);
    expect(stepsLines({ ...basis, listDate: '2026-08-01' }).at(-1)).toBe(
      'De la lista del 01/08/2026',
    );
  });
});
