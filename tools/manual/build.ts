// Arma el manual desde docs/manual/ (diseño del manual, § 2): el índice en el orden de la lista,
// un JSON por capítulo escrito, lo que recorre el buscador por dispositivo y los archivos de media/.
// Si algo no cierra, devuelve los problemas y nada para servir: un error de redacción no llega a la
// pantalla.
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  type Chapter,
  type ChapterEntry,
  type Device,
  devices,
  type ManualIndex,
  manualFiles,
  type SearchTask,
  type Task,
} from '../../src/shared/contracts/manual.ts';
import { type ParsedChapter, parseChapter } from './chapter.ts';
import { type ListEntry, parseList } from './list.ts';
import { readMedia } from './media.ts';
import { type Context, taskOf } from './task.ts';
import { type Problems, problemAt } from './text.ts';

export type Built = { files: Map<string, Buffer>; problems: Problems };

// Los topes de lo que arma (diseño del manual, § 2).
export const maxBytes = { index: 4 * 1024, chapter: 16 * 1024, search: 40 * 1024 };

function readPlain(dir: string, file: string, problems: Problems): string | undefined {
  try {
    if (lstatSync(join(dir, file)).isFile()) return readFileSync(join(dir, file), 'utf8');
  } catch {}
  problems.push(`docs/manual/${file}: no existe o no es un archivo común`);
  return undefined;
}

// Lo que se mira del capítulo entero: el título, los ids repetidos y la introducción de cada
// dispositivo que tiene tareas.
function checkChapter(
  file: string,
  entry: ListEntry,
  parsed: ParsedChapter,
  tasks: Task[],
  problems: Problems,
) {
  const report = (line: number, message: string) => problems.push(problemAt(file, line, message));
  if (parsed.name !== entry.name)
    report(1, `el título tiene que ser «${entry.name}», como en la lista`);
  const seen = new Set<string>();
  parsed.tasks.forEach(({ line }, index) => {
    const { device, id } = tasks[index] as Task;
    if (seen.has(`${device}/${id}`)) report(line, `el id «${id}» se repite en ese dispositivo`);
    seen.add(`${device}/${id}`);
  });
  for (const device of new Set(tasks.map((task) => task.device)))
    if (!parsed.intro[device]) report(1, `falta la introducción de ${introName[device]}`);
}

const introName: Record<Device, string> = { computer: 'Computadora', phone: 'Celular' };

function chapterOf(dir: string, entry: ListEntry, context: Context): Chapter | undefined {
  const file = entry.file as string;
  const text = readPlain(dir, file, context.problems);
  if (text === undefined) return undefined;
  const parsed = parseChapter(file, text, context.problems);
  const tasks = parsed.tasks.map((task) => taskOf({ ...context, file }, task));
  checkChapter(file, entry, parsed, tasks, context.problems);
  const intro = { computer: parsed.intro.computer ?? '', phone: parsed.intro.phone ?? '' };
  return { id: entry.id, name: entry.name, intro, tasks };
}

function goesToOf(
  entry: ListEntry,
  chapters: Map<string, Chapter>,
  problems: Problems,
): ChapterEntry['goesTo'] {
  const wanted = entry.goesTo as NonNullable<ListEntry['goesTo']>;
  const target = chapters.get(wanted.chapter);
  const bad = (message: string) => void problems.push(problemAt('README.md', entry.line, message));
  if (!target) return bad(`«${wanted.chapter}» no es un capítulo escrito`);
  const tasks: Partial<Record<Device, string>> = {};
  for (const { id, device } of wanted.tasks) {
    if (!target.tasks.some((task) => task.id === id && task.device === device))
      bad(`no existe la tarea «${id}» de ${introName[device]} en «${wanted.chapter}»`);
    if (tasks[device]) bad(`lleva a dos tareas de ${introName[device]}`);
    tasks[device] = id;
  }
  return { chapter: wanted.chapter, tasks };
}

function searchOf(chapters: Chapter[], device: Device): SearchTask[] {
  return chapters.flatMap((chapter) =>
    chapter.tasks
      .filter((task) => task.device === device)
      .map((task) => ({
        chapter: chapter.id,
        task: task.id,
        title: task.title,
        ...(task.note && { note: task.note }),
        texts: [...task.steps.map((step) => step.text), ...task.tips],
      })),
  );
}

function strayFiles(dir: string, entries: ListEntry[], problems: Problems): void {
  const listed = new Set(entries.flatMap((entry) => (entry.file ? [entry.file] : [])));
  for (const file of readdirSync(dir))
    if (file !== 'README.md' && file !== 'media' && !listed.has(file))
      problems.push(`docs/manual/${file}: no está en la lista de README.md`);
}

function filesOf(index: ManualIndex, chapters: Chapter[], context: Context): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  const add = (name: string, value: unknown, max?: number) => {
    const bytes = Buffer.from(JSON.stringify(value));
    if (max !== undefined && bytes.length > max)
      context.problems.push(`/manual/${name}: pesa ${bytes.length} bytes (tope ${max})`);
    files.set(name, bytes);
  };
  add(manualFiles.index, index, maxBytes.index);
  for (const chapter of chapters) add(manualFiles.chapter(chapter.id), chapter, maxBytes.chapter);
  for (const device of devices)
    add(manualFiles.search(device), searchOf(chapters, device), maxBytes.search);
  for (const [file, bytes] of context.media.files) {
    if (context.used.has(file)) files.set(manualFiles.media(file), bytes);
    else context.problems.push(`docs/manual/media/${file}: nadie lo usa`);
  }
  return files;
}

// El renglón del índice: con el resumen de sus tareas si está escrito, o a dónde lleva.
function indexEntryOf(
  entry: ListEntry,
  chapters: Map<string, Chapter>,
  problems: Problems,
): ChapterEntry {
  const { id, name, icon } = entry;
  const chapter = chapters.get(id);
  const goesTo = entry.goesTo && goesToOf(entry, chapters, problems);
  if (goesTo) return { id, name, icon, goesTo };
  if (!chapter) return { id, name, icon };
  const tasks = chapter.tasks.map(({ note, clip, tips, steps, ...summary }) => ({
    ...summary,
    steps: steps.length,
  }));
  return { id, name, icon, tasks };
}

export function buildManual(manualDir: string, version: string, icons: Set<string>): Built {
  const problems: Problems = [];
  const readme = readPlain(manualDir, 'README.md', problems);
  const entries = readme === undefined ? [] : parseList(readme, problems);
  if (readme !== undefined) strayFiles(manualDir, entries, problems);
  const context: Context = {
    file: 'README.md',
    icons,
    media: readMedia(manualDir, problems),
    used: new Set(),
    problems,
  };
  const chapters = new Map<string, Chapter>();
  for (const entry of entries) {
    if (!icons.has(entry.icon))
      problems.push(
        problemAt('README.md', entry.line, `el ícono «${entry.icon}» no está en el manual`),
      );
    const chapter = entry.file ? chapterOf(manualDir, entry, context) : undefined;
    if (chapter) chapters.set(entry.id, chapter);
  }
  const index: ManualIndex = {
    version,
    chapters: entries.map((entry) => indexEntryOf(entry, chapters, problems)),
  };
  const files = filesOf(index, [...chapters.values()], context);
  return problems.length > 0 ? { files: new Map(), problems } : { files, problems };
}
