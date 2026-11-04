// Lo que el vínculo escucha de la aplicación (diseño de 03, § 6 y § 11.1): la sesión, la huella `l=`,
// la pestaña a la vista y con el candado; y la cabecera de las escrituras mientras espeja.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStore } from '../../platform/store.ts';
import { pc } from '../../testing/pairing.ts';
import { linkRuntime, watchDeviceLink } from './index.ts';
import type { PairingState } from './machine/types.ts';
import type { Runtime } from './runtime.ts';
import { watchLink } from './watch.ts';

function setup(person: string | undefined, { visible = true, mine = true } = {}) {
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
  it('con sesión y a la vista pregunta al abrir; la huella `l=` hace mirar de nuevo', () => {
    const { runtime, field, stop } = setup('ana');
    expect(runtime.check).toHaveBeenCalledTimes(1);
    field()('abc');
    expect(runtime.pairingChanged).toHaveBeenCalled();
    stop();
  });

  it('salir avisa como la misma persona; entrar otra, como otra, y pregunta', () => {
    const { runtime, who } = setup('ana');
    who.set(undefined);
    expect(runtime.dispatch).toHaveBeenLastCalledWith({ type: 'sessionLost', samePerson: true });
    who.set('beto');
    expect(runtime.check).toHaveBeenCalledTimes(2);
    who.set('carla');
    expect(runtime.dispatch).toHaveBeenLastCalledWith({ type: 'sessionLost', samePerson: false });
    who.set('carla');
    expect(runtime.dispatch).toHaveBeenCalledTimes(2);
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
    expect(runtime.dispatch).toHaveBeenCalledTimes(3);
  });

  it('sin sesión, la pestaña no hace nada; oculta al abrir, tampoco pregunta', () => {
    const empty = setup(undefined, { visible: false });
    empty.view.visible = true;
    empty.tab();
    expect(empty.runtime.dispatch).not.toHaveBeenCalled();
    const hidden = setup('ana', { visible: false });
    expect(hidden.runtime.check).not.toHaveBeenCalled();
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
