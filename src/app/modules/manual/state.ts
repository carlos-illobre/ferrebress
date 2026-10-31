// Lo que pasa en el manual (diseño del manual, § 5), como acciones con nombre y un reductor puro: el
// dispositivo elegido, la tarea y el paso abiertos, «Todos los pasos», la hoja del celular y el clip.
// Pasar de la última tarea o volver de la primera recorre las tareas del capítulo en su orden.
import type { Device, ManualIndex, TaskSummary } from '@ferrebress/shared/contracts/manual';

export type ManualState = {
  device: Device;
  chapter?: string;
  task?: string;
  step: number;
  // Hacia dónde se pasó: la captura entra desde ese lado.
  direction: -1 | 0 | 1;
  allSteps: boolean;
  // «Todos los pasos» abierto desde una tarea: llega a ella y destella.
  allFrom?: string;
  // En el celular, el paso a paso es una hoja.
  sheet: boolean;
  clip: boolean;
  // Cuántas veces se pidió el clip: pedirlo de nuevo (Alt V) lo vuelve a empezar.
  plays?: number;
};

export type Action =
  | { type: 'chooseDevice'; device: Device; first: boolean }
  | { type: 'openTask'; chapter: string; task: string; step?: number }
  | { type: 'goToStep'; step: number }
  | { type: 'next' }
  | { type: 'previous' }
  // Desde una tarea (llega a ella) o desde la lista, con el capítulo.
  | { type: 'openAllSteps'; chapter?: string }
  | { type: 'closeAllSteps' }
  | { type: 'closeSheet' }
  | { type: 'playClip' };

// Las tareas de un capítulo para un dispositivo, en su orden.
export const tasksOf = (index: ManualIndex, chapter: string | undefined, device: Device) =>
  index.chapters
    .find((entry) => entry.id === chapter)
    ?.tasks?.filter((task) => task.device === device) ?? [];

// La tarea que sigue en el manual: la próxima del capítulo o, al terminarlo, la primera del capítulo
// que sigue (pedido de Carlos: «Terminado» no llevaba a ningún lado).
export function taskAfter(
  index: ManualIndex,
  chapter: string | undefined,
  task: string,
  device: Device,
) {
  const all = index.chapters.flatMap((entry) =>
    tasksOf(index, entry.id, device).map((one) => ({ chapter: entry.id, task: one })),
  );
  return all[all.findIndex((one) => one.chapter === chapter && one.task.id === task) + 1];
}

// La primera tarea del manual para un dispositivo: el paso a paso de la computadora arranca ahí.
export function firstTask(index: ManualIndex, device: Device) {
  for (const chapter of index.chapters) {
    const task = chapter.tasks?.find((one) => one.device === device);
    if (task) return { chapter: chapter.id, task: task.id };
  }
  return undefined;
}

// «Todos los pasos»: desde una tarea llega a ella; desde la lista, del capítulo elegido.
function openAllSteps(state: ManualState, index: ManualIndex, chapter?: string): ManualState {
  const { allFrom: _, ...rest } = state;
  if (chapter) return { ...allStepsOf(rest, index, chapter), allSteps: true };
  return state.task ? { ...rest, allSteps: true, allFrom: state.task, clip: false } : state;
}

// «Todos los pasos» de un capítulo desde la lista. Si había una tarea abierta de otro capítulo, queda
// la primera de este: al cerrarlo, el paso a paso y la dirección son de un mismo capítulo.
function allStepsOf(state: ManualState, index: ManualIndex, chapter: string): ManualState {
  if (!state.task || chapter === state.chapter) return { ...state, chapter, clip: false };
  const { task: _, ...rest } = state;
  const task = tasksOf(index, chapter, state.device)[0]?.id;
  return { ...rest, chapter, ...(task && { task }), step: 0, direction: 0, clip: false };
}

// Con el paso a paso a la vista (la pantalla ancha) arranca en la primera tarea; en la angosta no hay
// nada abierto hasta que se toca una tarea, así el celular no baja nada que nadie pidió
// (constitución, III).
export function startState(index: ManualIndex, device: Device, first: boolean): ManualState {
  return {
    device,
    ...(first && firstTask(index, device)),
    step: 0,
    direction: 0,
    allSteps: false,
    sheet: false,
    clip: false,
  };
}

const open = (state: ManualState, chapter: string, task: TaskSummary, step: number) => ({
  ...state,
  chapter,
  task: task.id,
  step: Math.max(0, Math.min(step, task.steps - 1)),
  direction: 0 as const,
  sheet: true,
  clip: false,
});

function move(state: ManualState, index: ManualIndex, way: 1 | -1): ManualState {
  const tasks = tasksOf(index, state.chapter, state.device);
  const at = tasks.findIndex((task) => task.id === state.task);
  const task = tasks[at];
  if (!task) return state;
  const step = state.step + way;
  if (step >= 0 && step < task.steps) return { ...state, step, direction: way, clip: false };
  if (way > 0) {
    const after = taskAfter(index, state.chapter, task.id, state.device);
    return after ? open(state, after.chapter, after.task, 0) : { ...state, sheet: false };
  }
  const before = tasks[at - 1];
  return before ? open(state, state.chapter as string, before, before.steps - 1) : state;
}

export function reduce(state: ManualState, action: Action, index: ManualIndex): ManualState {
  switch (action.type) {
    case 'chooseDevice':
      return startState(index, action.device, action.first);
    case 'openTask': {
      const task = tasksOf(index, action.chapter, state.device).find(
        (one) => one.id === action.task,
      );
      return task
        ? { ...open(state, action.chapter, task, action.step ?? 0), allSteps: false }
        : state;
    }
    case 'goToStep':
      return {
        ...state,
        step: action.step,
        direction: action.step > state.step ? 1 : -1,
        clip: false,
      };
    case 'next':
      return move(state, index, 1);
    case 'previous':
      return move(state, index, -1);
    case 'openAllSteps':
      return openAllSteps(state, index, action.chapter);
    case 'closeAllSteps':
      return { ...state, allSteps: false };
    case 'closeSheet':
      return { ...state, sheet: false, allSteps: false, clip: false };
    case 'playClip':
      return { ...state, clip: true, plays: (state.plays ?? 0) + 1 };
  }
}
