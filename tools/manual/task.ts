// Una tarea leída de un capítulo, pasada a lo que lee la pantalla (diseño del manual, § 2): sus
// claves comprobadas, cada paso con su ícono y su captura con el punto ya ubicado. Anota en `used`
// los archivos de media/ que usa, para avisar los que nadie usa.
import type { Step, Task } from '../../src/shared/contracts/manual.ts';
import { deviceNames, type ParsedStep, type ParsedTask, tagOf } from './chapter.ts';
import type { Media } from './media.ts';
import { isName, type Problems, problemAt } from './text.ts';

export type Context = {
  file: string;
  icons: Set<string>;
  media: Media;
  used: Set<string>;
  problems: Problems;
};

const required = ['Id', 'Dispositivo', 'Ícono'];

// Un ícono vacío ya lo avisó la tarea a la que le falta («Ícono»).
function iconOf(context: Context, icon: string, line: number): string {
  if (icon !== '' && !context.icons.has(icon))
    context.problems.push(problemAt(context.file, line, `el ícono «${icon}» no está en el manual`));
  return icon;
}

function stepOf(context: Context, step: ParsedStep, taskIcon: string): Step {
  const icon = iconOf(context, step.icon ?? taskIcon, step.line);
  const wanted = step.capture;
  if (!wanted) return { text: step.text, icon };
  const scene = context.media.scenes.get(wanted.scene);
  const point = scene?.points[wanted.point];
  if (!scene || !point) {
    const missing = scene ? `el punto «${wanted.point}» en` : 'la escena';
    context.problems.push(
      problemAt(context.file, wanted.line, `no existe ${missing} «${wanted.scene}»`),
    );
    return { text: step.text, icon };
  }
  context.used.add(`${wanted.scene}.webp`);
  const { device, width, height } = scene;
  return {
    text: step.text,
    icon,
    capture: { scene: wanted.scene, device, width, height, point, label: wanted.label },
  };
}

function clipOf(context: Context, task: ParsedTask): string | undefined {
  const clip = task.keys.get('Clip');
  if (!clip) return undefined;
  if (!context.media.clips.has(clip.value)) {
    context.problems.push(problemAt(context.file, clip.line, `no existe el clip «${clip.value}»`));
    return undefined;
  }
  context.used.add(`${clip.value}.webm`).add(`${clip.value}.end.webp`);
  return clip.value;
}

// Las claves obligatorias y las que tienen forma: lo que no cierra va a los problemas.
function checkKeys(context: Context, task: ParsedTask): void {
  const report = (line: number, message: string) =>
    context.problems.push(problemAt(context.file, line, message));
  const missing = required.filter((key) => !task.keys.has(key));
  if (missing.length > 0) report(task.line, `a la tarea le falta ${missing.join(', ')}`);
  if (task.steps.length === 0) report(task.line, 'la tarea no tiene pasos');
  const checks: [string, (value: string) => boolean, string][] = [
    ['Id', isName, 'el id va en inglés, con guiones'],
    ['Dispositivo', (value) => value in deviceNames, 'el dispositivo es «computadora» o «celular»'],
    ['Marca', (value) => tagOf(value) !== undefined, 'la marca es «entera / corta»'],
  ];
  for (const [key, valid, message] of checks) {
    const found = task.keys.get(key);
    if (found && !valid(found.value)) report(found.line, message);
  }
}

function basicsOf(context: Context, task: ParsedTask) {
  checkKeys(context, task);
  const value = (key: string) => task.keys.get(key)?.value ?? '';
  const icon = task.keys.get('Ícono');
  return {
    id: value('Id'),
    device: deviceNames[value('Dispositivo')] ?? 'computer',
    icon: icon ? iconOf(context, icon.value, icon.line) : '',
    tag: tagOf(value('Marca')),
  };
}

export function taskOf(context: Context, task: ParsedTask): Task {
  const { id, device, icon, tag } = basicsOf(context, task);
  const note = task.keys.get('Aclaración')?.value;
  const clip = clipOf(context, task);
  return {
    id,
    device,
    title: task.title,
    icon,
    ...(tag && { tag }),
    ...(note && { note }),
    ...(clip && { clip }),
    steps: task.steps.map((step) => stepOf(context, step, icon)),
    tips: task.tips,
  };
}
