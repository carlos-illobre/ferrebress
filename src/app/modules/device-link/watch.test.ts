// Lo que el vínculo escucha de la aplicación (diseño de 03, § 6 y § 11.1): la sesión, la huella `l=`,
// la pestaña a la vista y con el candado; y la cabecera de las escrituras mientras espeja.

import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startParts } from '../../platform/server/start-parts.ts';
import { createStore } from '../../platform/store.ts';
import { pc } from '../../testing/pairing.ts';
import { person } from '../sign-in/index.ts';
import { ana } from '../sign-in/sign-in-test-kit.ts';
import { linkRuntime, watchDeviceLink } from './index.ts';
import type { PairingState } from './machine/types.ts';
import type { Runtime } from './runtime.ts';
import { pairingAt, stripOfPerson } from './start.ts';
import { watchLink } from './watch.ts';

type Setup = { visible?: boolean; mine?: boolean; start?: PairingView | null | undefined };

function setup(person: string | undefined, options: Setup = {}) {
  const { visible = true, mine = true } = options;
  // Sin decir nada, /api/start ya contestó sin vínculo; `start: undefined`, todavía no contestó.
  const atStart = createStore('start' in options ? options.start : null);
  const runtime = {
    state: createStore<PairingState>({ kind: 'asleep' }),
    dispatch: vi.fn(),
    check: vi.fn(async () => undefined),
    pairingChanged: vi.fn(),
  };
  const who = createStore(person);
  let field: (value: string | undefined) => void = () => undefined;
  let decorator: (request: { write: boolean }) => Record<string, string> = () => ({});
  let tabChanged: () => void = () => undefined;
  const view = { visible, mine };
  const stop = watchLink({
    runtime: runtime as unknown as Runtime,
    who,
    atStart,
    onField: (_letter, listener) => {
      field = listener;
      return () => undefined;
    },
    decorate: (d) => {
      decorator = d;
      return () => undefined;
    },
    tabs: (onChange) => {
      tabChanged = onChange;
      return { mine: () => view.mine, stop: vi.fn() };
    },
    visible: () => view.visible,
  });
  return {
    runtime,
    atStart,
    who,
    view,
    stop,
    field: () => field,
    decorator: () => decorator,
    tab: () => tabChanged(),
  };
}

afterEach(() => vi.restoreAllMocks());

describe('lo que el vínculo escucha', () => {
  it('al abrir toma el vínculo de /api/start sin preguntar; la huella `l=` hace mirar de nuevo', () => {
    const { runtime, field, stop } = setup('ana', { start: pc });
    expect(runtime.dispatch).toHaveBeenCalledWith({ type: 'serverSaid', pairing: pc });
    expect(runtime.check).not.toHaveBeenCalled();
    field()('abc');
    expect(runtime.pairingChanged).toHaveBeenCalled();
    stop();
  });

  it('si /api/start no contestó todavía, espera su respuesta', () => {
    const { runtime, atStart } = setup('ana', { start: undefined });
    expect(runtime.dispatch).not.toHaveBeenCalled();
    atStart.set(null);
    expect(runtime.dispatch).toHaveBeenCalledWith({ type: 'serverSaid', pairing: null });
    atStart.set(pc);
    expect(runtime.dispatch).toHaveBeenCalledTimes(1);
  });

  it('salir avisa como la misma persona; entrar otra, como otra, y pregunta', () => {
    const { runtime, who } = setup('ana');
    who.set(undefined);
    expect(runtime.dispatch).toHaveBeenLastCalledWith({ type: 'sessionLost', samePerson: true });
    who.set('beto');
    expect(runtime.check).toHaveBeenCalledTimes(1);
    who.set('carla');
    expect(runtime.dispatch).toHaveBeenLastCalledWith({ type: 'sessionLost', samePerson: false });
    expect(runtime.check).toHaveBeenCalledTimes(2);
    who.set('carla');
    expect(runtime.dispatch).toHaveBeenCalledTimes(3);
  });

  it('otra pestaña toma el espejo, se oculta y vuelve', () => {
    const { runtime, view, tab } = setup('ana');
    view.mine = false;
    tab();
    expect(runtime.dispatch).toHaveBeenLastCalledWith({ type: 'tabAway', why: 'handover' });
    view.mine = true;
    runtime.state.set({ kind: 'away', pairing: pc });
    tab();
    expect(runtime.dispatch).toHaveBeenLastCalledWith({ type: 'tabBack' });
    view.visible = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(runtime.dispatch).toHaveBeenLastCalledWith({ type: 'tabAway', why: 'hidden' });
    tab();
    expect(runtime.dispatch).toHaveBeenCalledTimes(4);
    // Después del primero, volver a tomar la pestaña pregunta.
    view.visible = true;
    runtime.state.set({ kind: 'unpaired' });
    tab();
    expect(runtime.check).toHaveBeenCalledTimes(1);
  });

  it('sin sesión, la pestaña no hace nada; oculta al abrir, tampoco pregunta', () => {
    const empty = setup(undefined, { visible: false });
    empty.view.visible = true;
    empty.tab();
    expect(empty.runtime.dispatch).not.toHaveBeenCalled();
    const hidden = setup('ana', { visible: false, start: undefined });
    hidden.atStart.set(pc);
    expect(hidden.runtime.dispatch).not.toHaveBeenCalled();
    hidden.who.set('beto');
    expect(hidden.runtime.check).not.toHaveBeenCalled();
  });

  it('las escrituras mientras espeja dicen con qué vínculo', () => {
    const { runtime, decorator } = setup('ana');
    expect(decorator()({ write: true })).toEqual({});
    runtime.state.set({ kind: 'direct', pairing: pc, attempt: 'a' });
    expect(decorator()({ write: false })).toEqual({});
    expect(decorator()({ write: true })).toEqual({ 'X-Pairing': pc.id });
    runtime.state.set({ kind: 'relayed', pairing: pc, attempt: 'a' });
    expect(decorator()({ write: true })).toEqual({ 'X-Pairing': pc.id });
  });
});

describe('el vínculo de la aplicación', () => {
  it('arranca con la aplicación, aparte del arranque, y se suelta al cerrarla', async () => {
    const stop = watchDeviceLink();
    await vi.waitFor(() => expect(linkRuntime.get()?.state.get().kind).toBe('asleep'));
    stop();
    expect(linkRuntime.get()).toBeUndefined();
    // Cerrada antes de que llegue, no arranca.
    watchDeviceLink()();
    await import('./start.ts');
    await Promise.resolve();
    expect(linkRuntime.get()).toBeUndefined();
  });
});

describe('lo que lee el vínculo de la aplicación', () => {
  it('el vínculo de /api/start, validado: sin respuesta, ninguno o el que dijo', () => {
    expect(pairingAt(undefined)).toBeUndefined();
    expect(pairingAt({})).toBeNull();
    expect(pairingAt({ pairing: { id: 3 } })).toBeNull();
    expect(pairingAt({ pairing: pc })).toEqual(pc);
  });

  it('la tira es de quien tiene la sesión, una por persona', () => {
    const strip = stripOfPerson();
    person.set(undefined);
    expect(strip()).toBeUndefined();
    person.set(ana);
    const first = strip();
    expect(strip()).toBe(first);
    person.set({ ...ana, userId: 'otra' });
    expect(strip()).not.toBe(first);
    person.set(undefined);
  });

  it('se entera cuando cambia lo que dijo /api/start', async () => {
    const stop = watchDeviceLink();
    await vi.waitFor(() => expect(linkRuntime.get()).toBeDefined());
    startParts.set({ pairing: pc });
    startParts.set(undefined);
    stop();
  });
});
