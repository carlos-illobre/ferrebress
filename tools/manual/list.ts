// La lista de capítulos de docs/manual/README.md (diseño del manual, § 2): un renglón por capítulo,
// en el orden en que salen. Cambiar el orden es mover un renglón.
import type { Device } from '../../src/shared/contracts/manual.ts';
import { deviceNames } from './chapter.ts';
import { isName, type Problems, problemAt, splitDots } from './text.ts';

export type ListEntry = {
  id: string;
  name: string;
  icon: string;
  line: number;
  file?: string;
  goesTo?: { chapter: string; tasks: { id: string; device: Device }[] };
};

const heading = '## Los capítulos, en orden';
const readme = 'README.md';

// «→ capítulo: tarea (dispositivo), …»: a qué tarea lleva con cada dispositivo.
function goesToOf(target: string): ListEntry['goesTo'] {
  const found = /^→ ([a-z0-9-]+): (.+)$/.exec(target);
  if (!found) return undefined;
  const tasks = (found[2] as string)
    .split(',')
    .map((task) => /^([a-z0-9-]+) \((\w+)\)$/.exec(task.trim()));
  if (!tasks.every((task) => task && isName(task[1] as string) && deviceNames[task[2] as string]))
    return undefined;
  return {
    chapter: found[1] as string,
    tasks: tasks.map((task) => ({
      id: task?.[1] as string,
      device: deviceNames[task?.[2] as string] as Device,
    })),
  };
}

function entryOf(text: string, line: number, problems: Problems): ListEntry | undefined {
  const [id = '', name = '', icon = '', target, ...rest] = splitDots(text);
  const bad = (message: string) => {
    problems.push(problemAt(readme, line, message));
    return undefined;
  };
  if (rest.length > 0 || !isName(id) || name === '' || !isName(icon))
    return bad(
      'el renglón tiene que ser «id · nombre · ícono», con el archivo o el destino al final',
    );
  const entry: ListEntry = { id, name, icon, line };
  if (target === undefined) return entry;
  if (target === `${id}.md`) return { ...entry, file: target };
  const goesTo = goesToOf(target);
  if (goesTo) return { ...entry, goesTo };
  return bad(`al final va «${id}.md» o «→ <capítulo>: <tarea> (<dispositivo>), …», no «${target}»`);
}

// Los renglones de la sección de la lista, con su número, hasta el título que sigue.
function sectionLines(text: string): { text: string; line: number }[] | undefined {
  const lines = text.split('\n');
  const start = lines.indexOf(heading);
  if (start < 0) return undefined;
  const after = lines
    .slice(start + 1)
    .map((line, index) => ({ text: line, line: start + index + 2 }));
  const end = after.findIndex(({ text: line }) => line.startsWith('#'));
  return (end < 0 ? after : after.slice(0, end)).filter(({ text: line }) => line.trim() !== '');
}

// Los renglones de la lista, en orden. Lo que no tiene la forma va a `problems`.
export function parseList(text: string, problems: Problems): ListEntry[] {
  const lines = sectionLines(text);
  if (!lines) {
    problems.push(problemAt(readme, 1, `falta la sección «${heading}»`));
    return [];
  }
  const entries: ListEntry[] = [];
  for (const { text: line, line: number } of lines) {
    const entry = line.startsWith('- ')
      ? entryOf(line.slice(2), number, problems)
      : void problems.push(problemAt(readme, number, 'cada capítulo va en un renglón «- …»'));
    if (entry && entries.some((other) => other.id === entry.id))
      problems.push(problemAt(readme, number, `el capítulo «${entry.id}» está dos veces`));
    else if (entry) entries.push(entry);
  }
  return entries;
}
