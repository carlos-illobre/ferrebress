import { act } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { motionOff } from '../../platform/motion.ts';
import { timeFormat } from '../../platform/time.ts';
import { administrator } from '../../testing/person.ts';
import { person } from '../sign-in/index.ts';
import { backToDefaults, choose, preferences, watchPreferences } from './preferences.ts';
import { deviceSettingsSettings } from './settings.ts';

const id = (n: number) => `0190a000-0000-7000-8000-${String(n).padStart(12, '0')}`;
const someone = (n: number, name: string) => ({
  userId: id(n),
  name,
  email: `${name}@example.com`,
  ...administrator,
});
const juan = someone(1, 'juan');
const maria = someone(2, 'maria');
const saved = () => JSON.parse(localStorage.getItem('preferences') ?? 'null');

describe('lo que eligió cada persona en este dispositivo', () => {
  let stop: () => void;
  beforeEach(() => {
    localStorage.clear();
    act(() => person.set(undefined));
    stop = watchPreferences();
  });
  afterEach(() => {
    stop();
    act(() => person.set(undefined));
    vi.restoreAllMocks();
  });

  it('device-settings-E02, E03: cada persona tiene lo suyo y vuelve al entrar', () => {
    act(() => person.set(juan));
    choose(juan.userId, { animations: false });
    choose(juan.userId, { timeFormat: 'h12' });
    expect(motionOff.get()).toBe(true);
    expect(timeFormat.get()).toBe('h12');
    act(() => person.set(maria));
    expect(preferences.get()).toEqual({ animations: true, timeFormat: 'h24' });
    expect(motionOff.get()).toBe(false);
    expect(timeFormat.get()).toBe('h24');
    act(() => person.set(undefined));
    act(() => person.set(juan));
    expect(preferences.get()).toEqual({ animations: false, timeFormat: 'h12' });
  });

  it('device-settings-E04: lo elegido queda en este dispositivo: en otro, la misma persona tiene lo de arranque', () => {
    act(() => person.set(juan));
    choose(juan.userId, { timeFormat: 'h12' });
    // Otro dispositivo: otro lugar donde guardar, vacío.
    localStorage.clear();
    act(() => person.set(undefined));
    act(() => person.set(juan));
    expect(preferences.get()).toEqual({ animations: true, timeFormat: 'h24' });
  });

  it('device-settings-E05: en la entrada, sin nadie, lo de arranque', () => {
    act(() => person.set(juan));
    choose(juan.userId, { animations: false });
    act(() => person.set(undefined));
    expect(motionOff.get()).toBe(false);
  });

  it('device-settings-E33: volver a como viene borra su fila', () => {
    choose(juan.userId, { animations: false });
    choose(maria.userId, { timeFormat: 'h12' });
    backToDefaults(juan.userId);
    expect(saved()).toEqual({
      order: [maria.userId],
      of: { [maria.userId]: { animations: true, timeFormat: 'h12' } },
    });
  });

  it('device-settings-E06: si no se puede guardar, vale igual mientras está abierta', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('lleno');
    });
    act(() => person.set(juan));
    choose(juan.userId, { animations: false });
    expect(preferences.get().animations).toBe(false);
    expect(motionOff.get()).toBe(true);
    // Cambiar otra cosa no vuelve la primera a lo de arranque.
    choose(juan.userId, { timeFormat: 'h12' });
    expect(preferences.get()).toEqual({ animations: false, timeFormat: 'h12' });
  });

  it('el tope: con más de 20 personas sale la que cambió algo hace más tiempo', () => {
    for (let n = 1; n <= deviceSettingsSettings.maxPeople + 1; n += 1)
      choose(id(n), { animations: false });
    const { order } = saved();
    expect(order).toHaveLength(deviceSettingsSettings.maxPeople);
    expect(order[0]).toBe(id(deviceSettingsSettings.maxPeople + 1));
    expect(order).not.toContain(id(1));
  });

  it('seguridad: lo guardado roto o con otra forma cuenta como lo de arranque', () => {
    const cases = [
      '{roto',
      JSON.stringify({ order: 'x', of: 3 }),
      // Escrito como texto: un objeto armado en JavaScript no tendría la clave «__proto__».
      '{"order":["__proto__","no-es-uuid"],"of":{"__proto__":{"animations":false,"timeFormat":"h12"},"no-es-uuid":{"animations":false,"timeFormat":"h12"}}}',
      JSON.stringify({
        order: [juan.userId],
        of: { [juan.userId]: { animations: 'no', timeFormat: 'h24' } },
      }),
      JSON.stringify({
        order: [juan.userId],
        of: { [juan.userId]: { animations: false, timeFormat: 'sistema' } },
      }),
      JSON.stringify({ order: [juan.userId], of: {} }),
    ];
    for (const text of cases) {
      localStorage.setItem('preferences', text);
      act(() => person.set(undefined));
      act(() => person.set(juan));
      expect(preferences.get()).toEqual({ animations: true, timeFormat: 'h24' });
    }
    const many = Array.from({ length: 30 }, (_, n) => id(n + 10));
    const repeated = [juan.userId, juan.userId, ...many];
    localStorage.setItem(
      'preferences',
      JSON.stringify({
        order: repeated,
        of: Object.fromEntries(
          repeated.map((key) => [key, { animations: false, timeFormat: 'h24' }]),
        ),
      }),
    );
    choose(maria.userId, { timeFormat: 'h12' });
    expect(saved().order).toHaveLength(deviceSettingsSettings.maxPeople);
    expect(new Set(saved().order).size).toBe(deviceSettingsSettings.maxPeople);
  });
});
