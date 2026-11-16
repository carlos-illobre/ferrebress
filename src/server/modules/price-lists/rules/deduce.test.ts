// De quién es y de qué fecha es una planilla (08 · R4.3, R4.5).
import type { Head } from '@ferrebress/shared/contracts/price-lists';
import { describe, expect, it } from 'vitest';
import { dateIn, listDateOf, supplierByName } from './deduce.ts';

const sheet = (...titles: string[]): Head => [
  { name: 'Hoja 1', rows: titles.map((t) => [{ v: t, t }]) },
];
const today = '2026-11-16';

describe('la fecha de una lista', () => {
  it('price-lists-E35: la del título', () => {
    expect(listDateOf(sheet('LISTA DE PRECIOS — 14/8/2026'), 'lista.xlsx', today)).toEqual({
      date: '2026-08-14',
      from: 'sheet',
    });
  });

  it('la del nombre del archivo, si la planilla no dice', () => {
    expect(listDateOf(sheet('Lista'), 'precios 2026-09-01.xlsx', today)).toEqual({
      date: '2026-09-01',
      from: 'file-name',
    });
  });

  it('price-lists-E36: sin fecha, la de hoy', () => {
    expect(listDateOf(sheet('Lista'), 'lista.xlsx', today)).toEqual({
      date: today,
      from: 'server',
    });
  });

  it('price-lists-E84: una posterior a hoy o de más de un año atrás no se toma', () => {
    for (const title of ['LISTA 14/8/2062', 'LISTA 15/11/2025'])
      expect(listDateOf(sheet(title), 'lista.xlsx', today)).toEqual({
        date: today,
        from: 'server',
        ignored: true,
      });
    expect(listDateOf(sheet('LISTA 16/11/2025'), 'x', today).date).toBe('2025-11-16');
  });

  it('las formas de escribirla; una que no existe no es fecha', () => {
    expect(dateIn('vale desde 14-08-26')).toBe('2026-08-14');
    expect(dateIn('al 1.9.2026')).toBe('2026-09-01');
    expect(dateIn('código 31/02/2026 y 3/3/2026')).toBe('2026-03-03');
    expect(dateIn('sin fecha')).toBeUndefined();
  });
});

describe('el proveedor por su nombre', () => {
  const suppliers = [
    { id: 'ixnova', nameKey: 'ixnova' },
    { id: 'sur', nameKey: 'ferretera del sur' },
    { id: 'del', nameKey: 'del' },
  ];

  it('price-lists-E29b: escrito en el título, sin distinguir acentos ni mayúsculas', () => {
    expect(supplierByName(sheet('IXNOVA de HNZ SRL'), 'lista.xlsx', suppliers)).toBe('ixnova');
    expect(supplierByName(sheet('Lista'), 'Ferretera_del_Súr-2026.xlsx', suppliers)).toBe('sur');
  });

  it('palabras enteras, y el más largo si hay varios', () => {
    expect(supplierByName(sheet('IXNOVAS'), 'x.xlsx', suppliers)).toBeUndefined();
    expect(supplierByName(sheet('Ferretera del Sur'), 'x.xlsx', suppliers)).toBe('sur');
    expect(
      supplierByName(sheet('Lista'), 'x.xlsx', [{ id: 'nada', nameKey: '!!' }]),
    ).toBeUndefined();
  });
});
