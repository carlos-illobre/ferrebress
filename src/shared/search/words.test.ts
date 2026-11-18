import { describe, expect, it } from 'vitest';
import { codeOf, withinOne, wordsOf } from './words.ts';

describe('cómo se parte un texto para buscar', () => {
  it('las palabras, sin acentos ni mayúsculas, de 2 letras o más', () => {
    expect(wordsOf('Tornillo autoperforante 8 x 1" ÁGUILA')).toEqual([
      'tornillo',
      'autoperforante',
      'aguila',
    ]);
  });

  it('catalog-R3.2: un código, sin signos ni espacios', () => {
    expect(codeOf('A-1.2')).toBe('a12');
    expect(codeOf(' 7790001 000017 ')).toBe('7790001000017');
  });

  it('catalog-R3.1: a una letra de distancia', () => {
    expect(withinOne('tornilo', 'tornillo')).toBe(true);
    expect(withinOne('tornillo', 'tornilo')).toBe(true);
    expect(withinOne('tornikko', 'tornillo')).toBe(false);
    expect(withinOne('tornilko', 'tornillo')).toBe(true);
    expect(withinOne('tronillo', 'tornillo')).toBe(true);
    expect(withinOne('tornillo', 'tornillo')).toBe(false);
    expect(withinOne('torno', 'tornillo')).toBe(false);
    expect(withinOne('abc', 'abd')).toBe(true);
  });
});
