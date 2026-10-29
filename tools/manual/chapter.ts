// Un capítulo de docs/manual/ (diseño del manual, § 2): el título, la introducción de cada
// dispositivo y las tareas, cada una con sus claves, sus pasos numerados y sus consejos. Lo lee
// renglón por renglón; lo que no tiene la forma va a los problemas, con su renglón.
import type { Device, Tag } from '../../src/shared/contracts/manual.ts';
import { isName, type Problems, problemAt, splitDots, textProblem } from './text.ts';

export type ParsedStep = {
  text: string;
  line: number;
  icon?: string;
  capture?: { scene: string; point: string; label: string; line: number };
};

export type ParsedTask = {
  title: string;
  line: number;
  keys: Map<string, { value: string; line: number }>;
  steps: ParsedStep[];
  tips: string[];
};

export type ParsedChapter = {
  name: string;
  intro: Partial<Record<Device, string>>;
  tasks: ParsedTask[];
};

export const deviceNames: Record<string, Device> = { computadora: 'computer', celular: 'phone' };
export const taskKeys = ['Id', 'Dispositivo', 'Ícono', 'Marca', 'Clip', 'Aclaración'];

type Reader = { file: string; chapter: ParsedChapter; problems: Problems; line: number };

const report = (reader: Reader, message: string) =>
  reader.problems.push(problemAt(reader.file, reader.line, message));

function checkText(reader: Reader, text: string): string {
  const problem = textProblem(text);
  if (problem) report(reader, problem);
  return text;
}

function readIntro(reader: Reader, key: string, value: string): void {
  const device = deviceNames[key.toLowerCase()];
  if (!device) return void report(reader, 'la introducción es «- Computadora: …» o «- Celular: …»');
  reader.chapter.intro[device] = checkText(reader, value);
}

function readKey(reader: Reader, task: ParsedTask, key: string, value: string): void {
  if (task.steps.length > 0) return void report(reader, 'las claves van antes de los pasos');
  if (!taskKeys.includes(key)) return void report(reader, `clave desconocida: «${key}»`);
  if (task.keys.has(key)) return void report(reader, `la clave «${key}» está dos veces`);
  task.keys.set(key, { value: checkText(reader, value), line: reader.line });
}

function readStep(reader: Reader, task: ParsedTask, number: number, text: string): void {
  if (number !== task.steps.length + 1)
    report(reader, `este paso tendría que ser el ${task.steps.length + 1}`);
  task.steps.push({ text: checkText(reader, text), line: reader.line });
}

function readStepKey(reader: Reader, step: ParsedStep | undefined, key: string, value: string) {
  if (!step) return void report(reader, `«${key}» va debajo de un paso`);
  if (key === 'Ícono') {
    step.icon = value;
    return;
  }
  const [scene = '', point = '', label = '', ...rest] = splitDots(value);
  if (rest.length > 0 || !isName(scene) || !isName(point) || label === '')
    return void report(reader, 'la captura es «escena · punto · rótulo»');
  step.capture = { scene, point, label: checkText(reader, label), line: reader.line };
}

type Handler = (reader: Reader, found: string[], task: ParsedTask | undefined) => void;

const outsideTask = (reader: Reader) => report(reader, 'esto va dentro de una tarea («## …»)');

// Cada forma de renglón y qué se hace con ella. Los renglones vacíos no cuentan.
const handlers: [RegExp, Handler][] = [
  [
    /^## (.+)$/,
    (reader, [, title = '']) => {
      const keys = new Map();
      reader.chapter.tasks.push({
        title: checkText(reader, title),
        line: reader.line,
        keys,
        steps: [],
        tips: [],
      });
    },
  ],
  [
    /^- ([^:]+): (.+)$/,
    (reader, [, key = '', value = ''], task) =>
      task ? readKey(reader, task, key, value) : readIntro(reader, key, value),
  ],
  [
    /^(\d+)\. (.+)$/,
    (reader, [, number, text = ''], task) =>
      task ? readStep(reader, task, Number(number), text) : outsideTask(reader),
  ],
  [
    /^ {3}(Captura|Ícono): (.+)$/,
    (reader, [, key = '', value = ''], task) => readStepKey(reader, task?.steps.at(-1), key, value),
  ],
  [
    /^> (.+)$/,
    (reader, [, text = ''], task) =>
      task ? void task.tips.push(checkText(reader, text)) : outsideTask(reader),
  ],
];

function readLine(reader: Reader, text: string): void {
  if (text.trim() === '') return;
  for (const [pattern, handle] of handlers) {
    const found = pattern.exec(text);
    if (found) {
      handle(reader, [...found], reader.chapter.tasks.at(-1));
      return;
    }
  }
  report(reader, 'renglón que no tiene la forma del manual');
}

export function parseChapter(file: string, text: string, problems: Problems): ParsedChapter {
  const [first = '', ...lines] = text.split('\n');
  const chapter: ParsedChapter = { name: first.replace(/^# /, ''), intro: {}, tasks: [] };
  const reader: Reader = { file, chapter, problems, line: 1 };
  if (!first.startsWith('# ')) report(reader, 'el capítulo empieza con «# <nombre>»');
  lines.forEach((line, index) => {
    reader.line = index + 2;
    readLine(reader, line);
  });
  return chapter;
}

// La marca: «entera / corta».
export function tagOf(value: string): Tag | undefined {
  const [long, short, ...rest] = value.split(' / ').map((part) => part.trim());
  return long && short && rest.length === 0 ? { long, short } : undefined;
}
