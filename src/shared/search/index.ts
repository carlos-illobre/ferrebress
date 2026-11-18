// El índice para buscar productos (07 · R3; ADR-022), en memoria y sin nada del servidor: en 15b sirve
// también en el celular sin conexión. Guarda los que no están dados de baja, en orden alfabético por su
// descripción; cada palabra, con la lista de los que la tienen; y los códigos aparte, para encontrar
// uno escrito entero. Buscar es recorrer una vez esa lista marcando lo que encontró cada palabra: el
// resultado sale ya en orden, sin ordenar en cada búsqueda.
import { searchKey } from '../text/search-key.ts';
import { codeOf, withinOne, wordsOf } from './words.ts';

export type SearchDoc = {
  id: string;
  description: string;
  brand: string | null;
  // El del proveedor y el de barras.
  codes: readonly string[];
  priced: boolean;
};

export type Query = { text: string; brand?: string | undefined; noPrice?: boolean };
// Los encontrados en orden; los números, de todo el catálogo o de la marca elegida (07 · E16).
export type Found = { ids: string[]; total: number; noPrice: number };

// Un vocabulario ordenado, cada entrada con los productos que la tienen (en orden de la lista).
type Vocabulary = { terms: string[]; postings: number[][] };

const maxWords = 8;
const typoFrom = 4;

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

function vocabularyOf(entries: Map<string, number[]>): Vocabulary {
  const terms = [...entries.keys()].sort();
  return { terms, postings: terms.map((term) => entries.get(term) as number[]) };
}

const add = (entries: Map<string, number[]>, term: string, ord: number) => {
  const list = entries.get(term);
  if (!list) entries.set(term, [ord]);
  else if (list.at(-1) !== ord) list.push(ord);
};

// Los términos que empiezan con `prefix`, por búsqueda binaria.
function* withPrefix(vocabulary: Vocabulary, prefix: string): Generator<number[]> {
  const { terms } = vocabulary;
  let low = 0;
  let high = terms.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((terms[middle] as string) < prefix) low = middle + 1;
    else high = middle;
  }
  for (let i = low; i < terms.length && (terms[i] as string).startsWith(prefix); i++)
    yield vocabulary.postings[i] as number[];
}

function build(docs: readonly SearchDoc[]) {
  const sorted = [...docs].sort(
    (a, b) => collator.compare(a.description, b.description) || (a.id < b.id ? -1 : 1),
  );
  const words = new Map<string, number[]>();
  const codes = new Map<string, number[]>();
  sorted.forEach((doc, ord) => {
    for (const word of wordsOf(`${doc.description} ${doc.brand ?? ''}`)) add(words, word, ord);
    for (const code of doc.codes.map(codeOf)) if (code) add(codes, code, ord);
  });
  const byLength = new Map<number, number[]>();
  const vocabulary = vocabularyOf(words);
  vocabulary.terms.forEach((term, i) => {
    const same = byLength.get(term.length);
    if (same) same.push(i);
    else byLength.set(term.length, [i]);
  });
  return {
    ids: sorted.map((doc) => doc.id),
    brands: sorted.map((doc) => (doc.brand === null ? '' : searchKey(doc.brand))),
    priced: Uint8Array.from(sorted, (doc) => (doc.priced ? 1 : 0)),
    ordOf: new Map(sorted.map((doc, ord) => [doc.id, ord])),
    words: vocabulary,
    codes: vocabularyOf(codes),
    exactCodes: codes,
    byLength,
  };
}

type Built = ReturnType<typeof build>;

const markAll = (marks: Uint8Array, list: readonly number[], bit: number) => {
  for (const ord of list) marks[ord] = (marks[ord] as number) | bit;
};

// Las palabras y los códigos que empiezan con la palabra.
function markPrefix(built: Built, word: string, bit: number, marks: Uint8Array) {
  for (const vocabulary of [built.words, built.codes])
    for (const list of withPrefix(vocabulary, word)) markAll(marks, list, bit);
}

// Las palabras enteras a una letra de distancia, de su largo ±1 (R3.1).
function markTypos(built: Built, word: string, bit: number, marks: Uint8Array) {
  if (word.length < typoFrom) return;
  for (const length of [word.length - 1, word.length, word.length + 1])
    for (const t of built.byLength.get(length) ?? [])
      if (withinOne(word, built.words.terms[t] as string))
        markAll(marks, built.words.postings[t] as number[], bit);
}

// Marca lo que encontró cada palabra: sin error y empezada en `exact`, con un error en `typo`.
function mark(built: Built, words: string[]) {
  const exact = new Uint8Array(built.ids.length);
  const typo = new Uint8Array(built.ids.length);
  words.forEach((word, i) => {
    markPrefix(built, word, 1 << i, exact);
    markTypos(built, word, 1 << i, typo);
  });
  return { exact, typo };
}

// Las palabras de lo buscado; si no tiene ninguna de 2 letras («8»), lo escrito como código.
function wordsIn(text: string): string[] {
  const words = wordsOf(text).slice(0, maxWords);
  const code = codeOf(text);
  return words.length === 0 && code ? [code] : words;
}

// En qué grupo va cada uno (R3.2): el código entero, todas las palabras sin error, alguna con error;
// o en ninguno.
function grouper(built: Built, text: string) {
  const words = wordsIn(text);
  const all = (1 << words.length) - 1;
  const { exact, typo } = mark(built, words);
  const byCode = new Set(built.exactCodes.get(codeOf(text)) ?? []);
  return (ord: number): number | undefined => {
    if (byCode.has(ord)) return 0;
    if (exact[ord] === all) return 1;
    return ((exact[ord] as number) | (typo[ord] as number)) === all ? 2 : undefined;
  };
}

// Los de la marca elegida, o todos.
function inBrandOf(built: Built, brand: string | undefined) {
  const key = brand === undefined ? undefined : searchKey(brand);
  return (ord: number) => key === undefined || built.brands[ord] === key;
}

function search(built: Built, query: Query): Found {
  const groupOf = grouper(built, query.text);
  const inBrand = inBrandOf(built, query.brand);
  const groups: string[][] = [[], [], []];
  const counts = { total: 0, noPrice: 0 };
  for (let ord = 0; ord < built.ids.length; ord++) {
    if (!inBrand(ord)) continue;
    const priced = built.priced[ord] === 1;
    counts.total++;
    counts.noPrice += priced ? 0 : 1;
    const group = query.noPrice && priced ? undefined : groupOf(ord);
    if (group !== undefined) (groups[group] as string[]).push(built.ids[ord] as string);
  }
  return { ids: groups.flat(), ...counts };
}

export function createSearchIndex(initial: readonly SearchDoc[] = []) {
  const docs = new Map(initial.map((doc) => [doc.id, doc]));
  let built = build(initial);
  return {
    search: (query: Query): Found => search(built, query),
    // Las marcas, una vez cada una, en orden alfabético.
    brands(): string[] {
      const names = new Map<string, string>();
      for (const doc of docs.values())
        if (doc.brand !== null && !names.has(searchKey(doc.brand)))
          names.set(searchKey(doc.brand), doc.brand);
      return [...names.values()].sort(collator.compare);
    },
    size: (): number => docs.size,
    // Productos nuevos o cambiados, y los que ya no están (dados de baja): se arma de nuevo de una vez.
    replace(changed: readonly SearchDoc[], gone: readonly string[]): void {
      for (const id of gone) docs.delete(id);
      for (const doc of changed) docs.set(doc.id, doc);
      built = build([...docs.values()]);
    },
    // Solo cambió si tiene precio (un margen): sin volver a armar nada.
    setPriced(id: string, priced: boolean): void {
      const doc = docs.get(id);
      const ord = built.ordOf.get(id);
      if (!doc || ord === undefined) return;
      docs.set(id, { ...doc, priced });
      built.priced[ord] = priced ? 1 : 0;
    },
  };
}

export type SearchIndex = ReturnType<typeof createSearchIndex>;
