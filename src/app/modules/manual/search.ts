// El buscador del manual (00 · R6.6, diseño del manual, § 5), como la maqueta: busca desde dos
// letras, en el título, la aclaración, los pasos y los consejos de cada tarea del dispositivo elegido,
// en minúsculas y sin tildes, con todas las palabras. Muestra una fila por tarea, agrupadas bajo su
// capítulo en el orden de la lista, con el fragmento que coincidió. Nunca arma una expresión regular
// con lo que se escribe.
import type { ChapterEntry, ManualIndex, SearchTask } from '@ferrebress/shared/contracts/manual';

export const minQuery = 2;
export const maxQuery = 60;

// Letra por letra, para que cada posición del texto normalizado sea la misma del original.
export const normalize = (text: string) =>
  [...text]
    .map((letter) => letter.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()[0] ?? '')
    .join('');

const wordsOf = (query: string) => normalize(query.slice(0, maxQuery)).split(/\s+/).filter(Boolean);

export type Hit = { chapter: string; task: string; title: string; snippet: string; step: number };
export type Group = { chapter: ChapterEntry; hits: Hit[] };
export type Found = { groups: Group[]; soon: ChapterEntry[] };

const hasAll = (text: string, words: string[]) => {
  const plain = normalize(text);
  return words.every((word) => plain.includes(word));
};

// El texto que se muestra y el paso al que lleva: el primero que tiene todas las palabras, si no el
// que tiene la última, si no la aclaración o el primer paso. Un consejo lleva a su paso.
function hitOf(task: SearchTask, words: string[], steps: number): Hit {
  const body = [task.note ?? '', ...task.texts];
  const last = words.at(-1) as string;
  const index = [
    body.findIndex((text) => text !== '' && hasAll(text, words)),
    body.findIndex((text) => normalize(text).includes(last)),
  ].find((found) => found >= 0);
  const at = index ?? (task.note ? 0 : 1);
  const snippet = body[at] as string;
  const step = at === 0 ? 0 : Math.min(at - 1 < steps ? at - 1 : at - 1 - steps, steps - 1);
  return { chapter: task.chapter, task: task.task, title: task.title, snippet, step };
}

const score = (hit: Hit, words: string[]) =>
  normalize(hit.title).includes(words[0] as string) ? 1 : 0;

export function searchManual(
  query: string,
  index: ManualIndex,
  tasks: SearchTask[],
  testing: boolean,
): Found | undefined {
  const words = wordsOf(query);
  if (words.join(' ').length < minQuery) return undefined;
  const groups = index.chapters.flatMap((chapter) => {
    const steps = (task: string) =>
      chapter.tasks?.find((summary) => summary.id === task)?.steps ?? 1;
    const hits = tasks
      .filter((task) => task.chapter === chapter.id)
      .filter((task) => hasAll([task.title, task.note ?? '', ...task.texts].join(' '), words))
      .map((task) => hitOf(task, words, steps(task.task)))
      .sort((a, b) => score(b, words) - score(a, words));
    return hits.length > 0 ? [{ chapter, hits }] : [];
  });
  const soon = testing
    ? index.chapters.filter(
        (chapter) => !chapter.tasks && !chapter.goesTo && hasAll(chapter.name, words),
      )
    : [];
  return { groups, soon };
}

export type Piece = { text: string; marked: boolean };

// Los pedazos del texto, con lo buscado marcado: la pantalla los dibuja como texto y <mark>.
export function marks(text: string, query: string): Piece[] {
  const words = wordsOf(query);
  const plain = normalize(text);
  const pieces: Piece[] = [];
  const push = (piece: string, marked: boolean) => {
    const last = pieces.at(-1);
    if (last && last.marked === marked) last.text += piece;
    else pieces.push({ text: piece, marked });
  };
  let at = 0;
  while (at < text.length) {
    const word = words.find((one) => plain.startsWith(one, at));
    const size = word ? word.length : 1;
    push(text.slice(at, at + size), word !== undefined);
    at += size;
  }
  return pieces;
}
