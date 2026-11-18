// Cómo se parte un texto para buscar (07 · R3.1, R3.2; ADR-022): las palabras de una descripción o una
// marca, sin acentos ni mayúsculas, de 2 letras o más; y un código sin signos ni espacios, así «A-1.2»
// es «a12». Lo usan el índice y quien arma lo buscado, en el servidor y, con 15b, en el celular.
import { searchKey } from '../text/search-key.ts';

const separators = /[^\p{L}\p{N}]+/u;

export const wordsOf = (text: string): string[] =>
  searchKey(text)
    .split(separators)
    .filter((word) => word.length >= 2);

export const codeOf = (code: string): string => searchKey(code).replace(/[^\p{L}\p{N}]/gu, '');

// Como mucho estas palabras de lo buscado; lo demás no cuenta (R3.1).
export const maxWords = 8;

// Las palabras de lo buscado; si no tiene ninguna de 2 letras («t-8»), lo escrito como código.
export function queryWords(text: string): string[] {
  const words = wordsOf(text).slice(0, maxWords);
  const code = codeOf(text);
  return words.length === 0 && code ? [code] : words;
}

// Si dos palabras están a una letra de distancia: una que sobra, falta, cambia o se da vuelta con la
// de al lado (R3.1). Corta apenas pasa de una diferencia.
export function withinOne(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1 || a === b) return false;
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  const rest = (x: number, y: number) => a.slice(i + x) === b.slice(i + y);
  if (a.length === b.length)
    return rest(1, 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && rest(2, 2));
  return a.length > b.length ? rest(1, 0) : rest(0, 1);
}
