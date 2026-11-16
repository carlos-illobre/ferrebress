// Los comandos de los atajos de Configuración (04 · R1.9, R9.2), sobre un modelo de mentira: cuándo
// se pueden usar y qué hacen.
import { describe, expect, it, vi } from 'vitest';
import type { DeviceSettings } from '../useDeviceSettings.ts';
import { shortcuts } from './device-settings.ts';

const data = {
  here: { computers: [] },
  others: [
    { session: {}, computers: [] },
    { session: {}, computers: [] },
  ],
};

function model(
  change: { draft?: string; status?: string; current?: string; changed?: boolean } = {},
) {
  const calls: string[] = [];
  const call =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push([name, ...args.map((a) => JSON.stringify(a))].join(' '));
    };
  const fake = {
    settings: {
      chosen: { animations: true, timeFormat: 'h12' },
      changed: change.changed ?? false,
      install: 'button',
      set: call('set'),
      reset: call('reset'),
    },
    mine: { state: { status: change.status ?? 'ready', data } },
    here: {},
    name: {
      draft: change.draft,
      current: change.current,
      ideas: ['Caja', 'Mostrador'],
      edit: call('edit'),
      type: call('type'),
      clear: call('clear'),
    },
    closingAll: { ask: call('ask') },
    install: call('install'),
  } as unknown as DeviceSettings;
  return { fake, calls };
}
const run = (name: string, fake: DeviceSettings) =>
  (shortcuts.commands[name] as (m: DeviceSettings) => unknown)(fake);

describe('los atajos de Configuración', () => {
  it('las preferencias, instalar y cerrar todas', () => {
    const { fake, calls } = model({ changed: true });
    for (const name of ['animations', 'otherTimeFormat', 'reset', 'install', 'closeAll'])
      run(name, fake);
    expect(calls).toEqual([
      'set {"animations":false}',
      'set {"timeFormat":"h24"}',
      'reset',
      'install',
      'ask',
    ]);
  });

  it('instalar y cerrar todas, solo cuando se ve su botón', () => {
    const offline = model({ status: 'offline' });
    (offline.fake.settings as { install: string }).install = 'installed';
    expect(run('install', offline.fake)).toBe(false);
    expect(run('closeAll', offline.fake)).toBe(false);
    expect(offline.calls).toEqual([]);
  });

  it('volver a como viene, solo si algo cambió', () => {
    const { fake, calls } = model();
    expect(run('reset', fake)).toBe(false);
    expect(calls).toEqual([]);
  });

  it('el nombre: ponerlo y borrarlo, sin el campo abierto y con conexión', () => {
    const named = model({ current: 'Caja' });
    run('rename', named.fake);
    run('clearName', named.fake);
    expect(named.calls).toEqual(['edit', 'clear']);
    expect(run('clearName', model().fake)).toBe(false);
    expect(run('rename', model({ status: 'offline' }).fake)).toBe(false);
    expect(run('rename', model({ draft: '' }).fake)).toBe(false);
  });

  it('las ideas, solo con el campo abierto, y la que no existe no hace nada', () => {
    const open = model({ draft: '' });
    run('idea2', open.fake);
    expect(open.calls).toEqual(['type "Mostrador"']);
    expect(run('idea3', open.fake)).toBe(false);
    expect(run('idea1', model().fake)).toBe(false);
  });
});
