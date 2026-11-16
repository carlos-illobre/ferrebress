// Las letras del menú en el marco (00 · R2.13): Alt 0 lleva la marca a la parte abierta y la letra
// sola elige; con Alt, las letras son de la pantalla.
import { act, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { startKeyboard } from '../../testing/keyboard.ts';
import { later } from '../../testing/later.ts';
import {
  alt,
  letter,
  open,
  press,
  tipLabel,
  toMenu,
} from '../../views/basic/frame/frame-test-kit.tsx';
import { markedIn } from '../../views/basic/kit.ts';

describe('las letras del menú', () => {
  afterEach(() => vi.useRealTimers());

  it('app-E17b: Alt 0 lleva la marca a la parte abierta y deja ver las letras; la letra sola abre Más', async () => {
    const stop = startKeyboard();
    const { side } = open();
    act(() => toMenu());
    const marked = markedIn(side) as HTMLElement;
    expect(marked.getAttribute('aria-current')).toBe('page');
    act(() => letter('m'));
    await act(() => new Promise((resolve) => setTimeout(resolve)));
    const panel = screen.getByRole('list', { name: 'Más' });
    expect(markedIn(panel)).not.toBeNull();
    stop();
  });

  it('app-E17c: con Alt, las letras del menú no se usan: son de la pantalla; sin la marca en el menú, la letra sola tampoco', () => {
    const stop = startKeyboard();
    open();
    act(() => alt('m'));
    expect(screen.queryByRole('list', { name: 'Más' })).toBeNull();
    act(() => letter('m'));
    expect(screen.queryByRole('list', { name: 'Más' })).toBeNull();
    stop();
  });

  it('al minimizar con la marca en el botón, el rótulo lo sigue diciendo', async () => {
    vi.useFakeTimers();
    const stop = startKeyboard();
    open();
    act(() => press('ArrowDown'));
    act(() => letter('e'));
    await later(241);
    expect(tipLabel()).toBe('Agrandar el menú');
    stop();
  });
});
