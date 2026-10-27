import { act, render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { createStore, useStore } from './store.ts';

describe('un valor compartido', () => {
  it('avisa solo cuando cambia, y deja de avisar a quien se fue', () => {
    const store = createStore(1);
    const seen: number[] = [];
    const stop = store.subscribe((value) => seen.push(value));
    store.set(1);
    store.set(2);
    stop();
    store.set(3);
    expect(seen).toEqual([2]);
    expect(store.get()).toBe(3);
  });

  it('una pantalla lo muestra y se actualiza sola', () => {
    const store = createStore('En línea');
    function Light() {
      return <p>{useStore(store)}</p>;
    }
    render(<Light />);
    expect(screen.getByText('En línea')).toBeTruthy();
    act(() => store.set('Sin conexión'));
    expect(screen.getByText('Sin conexión')).toBeTruthy();
  });
});
