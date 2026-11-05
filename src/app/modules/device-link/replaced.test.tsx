// Entrar a otra computadora con el celular (R1.5): el celular avisa una vez el reemplazo, con
// «Desvincular»; no avisa si lo vinculó él leyendo el código, ni en la computadora.
import { act, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStore } from '../../platform/store.ts';
import { pairingView } from '../../testing/pairing.ts';
import { Toasts, toastWithActionMs } from '../../ui/toast/Toast.tsx';
import { reading, unpairAsked } from './detail.ts';
import type { PairingState } from './machine/types.ts';
import { watchReplaced } from './replaced.ts';
import type { Runtime } from './runtime.ts';

const phoneWith = (id: string, label: string): PairingState => ({
  kind: 'waiting',
  pairing: { ...pairingView('phone'), id, other: { label } },
});

function setup(start: PairingState) {
  const state = createStore(start);
  const stop = watchReplaced({ state } as unknown as Runtime);
  render(<Toasts />);
  return { state, stop };
}

afterEach(() => {
  unpairAsked.set(false);
  reading.set(undefined);
  vi.useRealTimers();
});

describe('el reemplazo al entrar a otra computadora', () => {
  it('lo avisa con «Desvincular», que abre la confirmación, y dura 6 segundos', () => {
    vi.useFakeTimers();
    const { state, stop } = setup(phoneWith('a', 'Chrome en Windows'));
    act(() => state.set(phoneWith('b', 'Edge en Windows')));
    expect(screen.getByText('Ahora este celular está vinculado a Edge en Windows')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Desvincular' }));
    expect(unpairAsked.get()).toBe(true);
    act(() => state.set(phoneWith('c', 'Otra')));
    act(() => {
      vi.advanceTimersByTime(toastWithActionMs);
    });
    expect(screen.queryByRole('status')).toBeNull();
    stop();
  });

  it('no avisa al vincular por primera vez, leyendo el código, ni en la computadora', () => {
    const { state, stop } = setup({ kind: 'unpaired' });
    act(() => state.set(phoneWith('a', 'Chrome en Windows')));
    reading.set({});
    act(() => state.set(phoneWith('b', 'Edge en Windows')));
    reading.set(undefined);
    act(() => state.set({ kind: 'waiting', pairing: { ...pairingView('computer'), id: 'c' } }));
    act(() => state.set({ kind: 'unpaired' }));
    expect(screen.queryByRole('status')).toBeNull();
    stop();
  });
});
