// Los comandos de los atajos del manual, sobre un modelo de mentira: cuándo se pueden usar y qué
// hacen.
import { describe, expect, it } from 'vitest';
import type { ManualScreen } from '../useManualScreen.ts';
import { shortcuts as allSteps } from './all-steps.ts';
import { shortcuts } from './manual.ts';

const task = { id: 't1', clip: 'c', steps: [{}, {}] };
function model({ loaded = true, reading = true, step = 1, narrow = false } = {}) {
  const acted: unknown[] = [];
  const index = { chapters: [{ id: 'ch', tasks: [{ ...task, device: 'computer' }] }] };
  const view = {
    index,
    state: { chapter: 'ch', task: 't1', step, device: 'computer' },
    narrow,
    task: reading ? task : undefined,
    act: (action: unknown) => acted.push(action),
  };
  const backs: number[] = [];
  const fake = {
    view: loaded ? view : undefined,
    goBack: () => backs.push(1),
  } as unknown as ManualScreen;
  return { fake, acted, backs };
}
const run = (commands: typeof shortcuts, name: string, fake: ManualScreen) =>
  (commands.commands[name] as (m: ManualScreen) => unknown)(fake);

describe('los atajos del manual', () => {
  it('el dispositivo, el clip, todos los pasos, anterior, siguiente y un paso', () => {
    const { fake, acted, backs } = model({ narrow: true });
    for (const name of [
      'computer',
      'phone',
      'clip',
      'allSteps',
      'previous',
      'next',
      'step2',
      'back',
    ])
      run(shortcuts, name, fake);
    expect(acted).toEqual([
      { type: 'chooseDevice', device: 'computer', first: false },
      { type: 'chooseDevice', device: 'phone', first: false },
      { type: 'playClip' },
      { type: 'openAllSteps' },
      { type: 'previous' },
      { type: 'next' },
      { type: 'goToStep', step: 1 },
    ]);
    expect(backs).toEqual([1]);
  });

  it('sin tarea, o en el primer paso, o un paso que no existe, no hacen nada', () => {
    const none = model({ reading: false });
    for (const name of ['clip', 'allSteps', 'previous', 'next', 'step1'])
      expect(run(shortcuts, name, none.fake)).toBe(false);
    expect(run(shortcuts, 'previous', model({ step: 0 }).fake)).toBe(false);
    expect(run(shortcuts, 'step3', model().fake)).toBe(false);
    expect(run(shortcuts, 'computer', model({ loaded: false }).fake)).toBe(false);
    expect(run(shortcuts, 'previous', model({ loaded: false }).fake)).toBe(false);
  });

  it('«Todos los pasos» se cierra', () => {
    const { fake, acted } = model();
    run(allSteps, 'close', fake);
    expect(acted).toEqual([{ type: 'closeAllSteps' }]);
    expect(run(allSteps, 'close', model({ loaded: false }).fake)).toBe(false);
  });
});
