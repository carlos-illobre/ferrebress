// Los atajos del manual (00 · R6, R2.8): el dispositivo, «Volver», el clip, «Todos los pasos», pasar
// de paso y un número por paso, del 1 al 9. Las teclas están en keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { Device } from '@ferrebress/shared/contracts/manual';
import { type Action, tasksOf } from '../state.ts';
import type { ManualScreen } from '../useManualScreen.ts';
import type { View } from '../view.ts';

const act = (model: ManualScreen, action: Action) => !!model.view && model.view.act(action);
const device = (chosen: Device) => (model: ManualScreen) =>
  act(model, { type: 'chooseDevice', device: chosen, first: !model.view?.narrow });
const reading = (model: ManualScreen) => model.view?.task;
// En el primer paso de la primera tarea no hay anterior (el botón está apagado).
function first(view: View): boolean {
  const { state } = view;
  return tasksOf(view.index, state.chapter, state.device)[0]?.id === state.task && state.step === 0;
}
const step = (at: number) => (model: ManualScreen) =>
  (reading(model)?.steps.length ?? 0) > at && act(model, { type: 'goToStep', step: at });

export const shortcuts = defineShortcuts<ManualScreen>('manual', {
  computer: device('computer'),
  phone: device('phone'),
  back: (model) => model.goBack(),
  clip: (model) => !!reading(model)?.clip && act(model, { type: 'playClip' }),
  allSteps: (model) => !!reading(model) && act(model, { type: 'openAllSteps' }),
  previous: (model) => !!model.view?.task && !first(model.view) && act(model, { type: 'previous' }),
  next: (model) => !!reading(model) && act(model, { type: 'next' }),
  ...Object.fromEntries(Array.from({ length: 9 }, (_, at) => [`step${at + 1}`, step(at)])),
});
