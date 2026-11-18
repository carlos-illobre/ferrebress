import { describe, expect, it } from 'vitest';
import { createSearchIndex, type SearchDoc } from './index.ts';

const doc = (id: string, description: string, more: Partial<SearchDoc> = {}): SearchDoc => ({
  id,
  description,
  brand: null,
  codes: [],
  priced: true,
  ...more,
});

const index = () =>
  createSearchIndex([
    doc('t1', 'Tornillo autoperforante 8 x 1', { brand: 'Fischer', codes: ['T-81'] }),
    doc('t2', 'Torno de banco', { brand: 'Bremen', priced: false }),
    doc('a1', 'Arandela A12 plana', { codes: ['ARA-9'] }),
    doc('c1', 'Clavo punta paris', { codes: ['A-1.2', '7790001000017'], brand: 'fischer' }),
    doc('m1', 'Martillo carpintero', { brand: 'Bremen', priced: false }),
  ]);
const ids = (text: string, more = {}) => index().search({ text, ...more }).ids;

describe('el índice para buscar productos', () => {
  it('catalog-E12: palabras empezadas, en cualquier orden, sin mayúsculas, y con un error', () => {
    expect(ids('autoperf torn')).toEqual(['t1']);
    expect(ids('TORNILLO')).toEqual(['t1']);
    expect(ids('tornilo')).toEqual(['t1']);
    expect(ids('torn')).toEqual(['t1', 't2']);
  });

  it('catalog-E24: el error solo en palabras de 4 letras o más, escritas enteras', () => {
    // «tornu» está a una letra de «torno», no de «tornillo».
    expect(ids('tornu')).toEqual(['t2']);
    expect(ids('tor')).toEqual(['t1', 't2']);
    expect(ids('trn')).toEqual([]);
  });

  it('las que tienen todas sus palabras sin error van antes que las que tienen alguno', () => {
    const typos = createSearchIndex([doc('x', 'Martilo chico'), doc('y', 'Martillo grande')]);
    expect(typos.search({ text: 'martillo' }).ids).toEqual(['y', 'x']);
  });

  it('catalog-E13: el código escrito entero va primero, aunque tenga signos', () => {
    expect(ids('A12')).toEqual(['c1', 'a1']);
    expect(ids('a-1.2')).toEqual(['c1', 'a1']);
  });

  it('catalog-E14: el código de barras entero, primero; empezado, también encuentra', () => {
    expect(ids('7790001000017')).toEqual(['c1']);
    expect(ids('779000')).toEqual(['c1']);
    // Sin palabras de 2 letras, lo escrito se busca como el principio de un código.
    expect(ids('t-8')).toEqual(['t1']);
    expect(ids('8')).toEqual([]);
  });

  it('catalog-E16: sin nada escrito, todos en orden alfabético, con los números', () => {
    expect(index().search({ text: '' })).toEqual({
      ids: ['a1', 'c1', 'm1', 't1', 't2'],
      total: 5,
      noPrice: 2,
    });
  });

  it('catalog-R3.4: por marca (sin mayúsculas) y «Sin precio»; los números, de la marca', () => {
    expect(index().search({ text: '', brand: 'FISCHER' })).toEqual({
      ids: ['c1', 't1'],
      total: 2,
      noPrice: 0,
    });
    expect(index().search({ text: '', noPrice: true })).toEqual({
      ids: ['m1', 't2'],
      total: 5,
      noPrice: 2,
    });
    expect(index().brands()).toEqual(['Bremen', 'Fischer']);
  });

  it('se pone al día: productos nuevos, cambiados y dados de baja; y si tienen precio', () => {
    const one = index();
    one.replace([doc('n1', 'Abrazadera'), doc('t2', 'Tenaza')], ['m1']);
    expect(one.search({ text: '' }).ids).toEqual(['n1', 'a1', 'c1', 't2', 't1']);
    expect(one.size()).toBe(5);
    one.setPriced('t2', true);
    one.setPriced('nadie', true);
    expect(one.search({ text: '', noPrice: true }).ids).toEqual([]);
    expect(one.brands()).toEqual(['Fischer']);
  });

  it('una palabra repetida, dos con la misma descripción y un código sin letras', () => {
    const odd = createSearchIndex([
      doc('b', 'Tornillo tornillo', { codes: ['-'] }),
      doc('a', 'Tornillo tornillo'),
    ]);
    expect(odd.search({ text: 'tornillo' }).ids).toEqual(['a', 'b']);
  });

  it('como mucho 8 palabras: lo demás no cuenta', () => {
    expect(ids('torn auto 8 x 1 a b c d e f g h i')).toEqual(['t1']);
  });
});
