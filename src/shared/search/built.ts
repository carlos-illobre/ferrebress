// Un índice armado de una vez, que no cambia (ADR-022): los productos en orden alfabético por la clave
// de su descripción (la misma que ordena a los dados de baja en la base), cada palabra y cada código con
// los que la tienen, y buscar recorriéndolo una vez. Armarlo puede ir de a pedazos (`pause`), para no
// frenar a quien lo usa mientras tanto.
import { searchKey } from '../text/search-key.ts';
import { codeOf, queryWords, withinOne, wordsOf } from './words.ts';

export type SearchDoc = {
  id: string;
  description: string;
  brand: string | null;
  // El del proveedor y el de barras.
  codes: readonly string[];
  priced: boolean;
};

export type Query = { text: string; brand?: string | undefined; noPrice?: boolean };

// Lo encontrado en un índice armado: en cada grupo (R3.2), en orden, con su clave para juntarlo con
// lo de otro; y los números (E16).
export type Hit = { key: string; id: string };
export type Partial = { groups: [Hit[], Hit[], Hit[]]; total: number; noPrice: number };

// Un vocabulario ordenado, cada entrada con los productos que la tienen (en orden de la lista), todos
// en un solo arreglo plano: los del término `i` van de `starts[i]` a `starts[i + 1]`. Así no hay un
// arreglo por término, que con 100.000 códigos pesa más que lo que guarda.
type Vocabulary = { terms: string[]; starts: Uint32Array; flat: Uint32Array };

const postingsOf = (vocabulary: Vocabulary, i: number): Uint32Array =>
  vocabulary.flat.subarray(vocabulary.starts[i], vocabulary.starts[i + 1]);

const typoFrom = 4;
const chunk = 5000;

function vocabularyOf(entries: Map<string, number[]>): Vocabulary {
  const terms = [...entries.keys()].sort();
  const starts = new Uint32Array(terms.length + 1);
  terms.forEach((term, i) => {
    starts[i + 1] = (starts[i] as number) + (entries.get(term) as number[]).length;
  });
  const flat = new Uint32Array(starts[terms.length] as number);
  terms.forEach((term, i) => {
    flat.set(entries.get(term) as number[], starts[i]);
  });
  return { terms, starts, flat };
}

const add = (entries: Map<string, number[]>, term: string, ord: number) => {
  const list = entries.get(term);
  if (!list) entries.set(term, [ord]);
  else if (list.at(-1) !== ord) list.push(ord);
};

// El primer término que no es menor que `term`, por búsqueda binaria.
function lowerBound(terms: readonly string[], term: string): number {
  let low = 0;
  let high = terms.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((terms[middle] as string) < term) low = middle + 1;
    else high = middle;
  }
  return low;
}

// Los términos que empiezan con `prefix`.
function* withPrefix(vocabulary: Vocabulary, prefix: string): Generator<Uint32Array> {
  const { terms } = vocabulary;
  for (
    let i = lowerBound(terms, prefix);
    i < terms.length && (terms[i] as string).startsWith(prefix);
    i++
  )
    yield postingsOf(vocabulary, i);
}

// Los que tienen ese término entero.
function exactly(vocabulary: Vocabulary, term: string): Uint32Array {
  const i = lowerBound(vocabulary.terms, term);
  return vocabulary.terms[i] === term ? postingsOf(vocabulary, i) : new Uint32Array();
}

// La clave de orden: la descripción sin acentos ni mayúsculas, y el identificador si se repite.
const keyOf = (doc: SearchDoc) => `${searchKey(doc.description)}\u0000${doc.id}`;

function lengthsOf(vocabulary: Vocabulary) {
  const byLength = new Map<number, number[]>();
  vocabulary.terms.forEach((term, i) => {
    const same = byLength.get(term.length);
    if (same) same.push(i);
    else byLength.set(term.length, [i]);
  });
  return byLength;
}

type Keyed = { doc: SearchDoc; key: string };

// Cada producto con su clave, en orden.
function* sorting(docs: readonly SearchDoc[]): Generator<undefined, Keyed[]> {
  const keyed: Keyed[] = [];
  for (const doc of docs) {
    keyed.push({ doc, key: keyOf(doc) });
    if (keyed.length % chunk === 0) yield;
  }
  keyed.sort((a, b) => (a.key < b.key ? -1 : 1));
  return keyed;
}

type Entries = { words: Map<string, number[]>; codes: Map<string, number[]> };

function addDoc({ words, codes }: Entries, doc: SearchDoc, ord: number) {
  for (const word of wordsOf(`${doc.description} ${doc.brand ?? ''}`)) add(words, word, ord);
  for (const code of doc.codes.map(codeOf)) if (code) add(codes, code, ord);
}

// Las palabras y los códigos de cada uno, con su lugar en la lista.
function* terms(keyed: readonly Keyed[]): Generator<undefined, Entries> {
  const entries: Entries = { words: new Map(), codes: new Map() };
  for (let ord = 0; ord < keyed.length; ord++) {
    if (ord > 0 && ord % chunk === 0) yield;
    addDoc(entries, (keyed[ord] as Keyed).doc, ord);
  }
  return entries;
}

// Arma el índice como generador: cada `yield` es un lugar donde se puede ceder el turno.
function* building(docs: readonly SearchDoc[]) {
  const keyed = yield* sorting(docs);
  yield;
  const { words, codes } = yield* terms(keyed);
  yield;
  const vocabulary = vocabularyOf(words);
  return {
    ids: keyed.map(({ doc }) => doc.id),
    keys: keyed.map(({ key }) => key),
    brands: keyed.map(({ doc }) => (doc.brand === null ? '' : searchKey(doc.brand))),
    priced: Uint8Array.from(keyed, ({ doc }) => (doc.priced ? 1 : 0)),
    ordOf: new Map(keyed.map(({ doc }, ord) => [doc.id, ord])),
    words: vocabulary,
    codes: vocabularyOf(codes),
    byLength: lengthsOf(vocabulary),
  };
}

export type Built = ReturnType<typeof build>;

// De una vez: para lo chico (lo que cambió) y al arrancar.
export function build(docs: readonly SearchDoc[]) {
  const steps = building(docs);
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
  }
}

// De a pedazos: entre uno y otro espera `pause`, que cede el turno a quien lo usa mientras tanto.
export async function buildInSteps(
  docs: readonly SearchDoc[],
  pause: () => Promise<void>,
): Promise<Built> {
  const steps = building(docs);
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
    await pause();
  }
}

const markAll = (marks: Uint8Array, list: Uint32Array, bit: number) => {
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
        markAll(marks, postingsOf(built.words, t), bit);
}

// En qué grupo va cada uno (R3.2): el código entero, todas las palabras sin error, alguna con error;
// o en ninguno.
function grouper(built: Built, text: string) {
  const words = queryWords(text);
  const all = (1 << words.length) - 1;
  const exact = new Uint8Array(built.ids.length);
  const typo = new Uint8Array(built.ids.length);
  words.forEach((word, i) => {
    markPrefix(built, word, 1 << i, exact);
    markTypos(built, word, 1 << i, typo);
  });
  const byCode = new Set(exactly(built.codes, codeOf(text)));
  return (ord: number): number | undefined => {
    if (byCode.has(ord)) return 0;
    if (exact[ord] === all) return 1;
    return ((exact[ord] as number) | (typo[ord] as number)) === all ? 2 : undefined;
  };
}

// Los que cuentan: de la marca elegida (o todos), salvo los que ya no valen acá (`skip`).
function countsIn(built: Built, brand: string | undefined, skip: Uint8Array | undefined) {
  const key = brand === undefined ? undefined : searchKey(brand);
  return (ord: number) => skip?.[ord] !== 1 && (key === undefined || built.brands[ord] === key);
}

export function searchBuilt(built: Built, query: Query, skip?: Uint8Array): Partial {
  const groupOf = grouper(built, query.text);
  const counts = countsIn(built, query.brand, skip);
  const found: Partial = { groups: [[], [], []], total: 0, noPrice: 0 };
  for (let ord = 0; ord < built.ids.length; ord++) {
    if (!counts(ord)) continue;
    const priced = built.priced[ord] === 1;
    found.total++;
    found.noPrice += priced ? 0 : 1;
    const group = query.noPrice && priced ? undefined : groupOf(ord);
    if (group !== undefined)
      (found.groups[group] as Hit[]).push({
        key: built.keys[ord] as string,
        id: built.ids[ord] as string,
      });
  }
  return found;
}
