// El teclado en el manual (00 · R2.8): todo botón tiene su atajo, también los segmentos del avance y
// el que vuelve a pasar el clip.
import type { ChapterEntry, Task } from '@ferrebress/shared/contracts/manual';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startKeyboard } from '../../testing/keyboard.ts';
import { keyShown } from '../../views/basic/kit.ts';
import {
  chapter,
  index,
  media,
  one,
  serveManual,
  show,
} from '../../views/basic/manual/manual-test-kit.tsx';

const guide = () => screen.getByRole('main') as HTMLElement;

describe('el teclado del manual', () => {
  beforeEach(() => media());
  afterEach(() => vi.unstubAllGlobals());

  it('R2.8: cada segmento del avance tiene su número, y Alt V vuelve a empezar el clip', async () => {
    serveManual();
    const play = vi.fn(() => Promise.resolve());
    Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: play });
    const stop = startKeyboard();
    show();
    await waitFor(() => expect(within(guide()).getByText('Mirá el código.')).toBeTruthy());
    const alt = (code: string) =>
      act(() => {
        dispatchEvent(new KeyboardEvent('keydown', { key: code, code, altKey: true }));
      });
    alt('Digit2');
    expect(within(guide()).getByText('Paso 2 de 3')).toBeTruthy();
    alt('KeyV');
    const first = one('video') as HTMLVideoElement;
    fireEvent(first, new Event('ended'));
    alt('KeyV');
    expect(play).toHaveBeenCalledTimes(2);
    expect(one('video')).not.toBe(first);
    // Alt T abre «Todos los pasos», que muestra su tecla, y Alt T lo cierra.
    alt('KeyT');
    const back = await screen.findByRole('button', { name: /Volver al paso a paso/ });
    expect(keyShown(back)).toBe('T');
    alt('KeyT');
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Volver al paso a paso/ })).toBeNull(),
    );
    stop();
  });

  it('R2.8: los atajos del avance llegan hasta el paso 9', async () => {
    const [first, ...rest] = chapter.tasks as [Task, ...Task[]];
    const long = { ...first, steps: Array.from({ length: 10 }, () => first.steps[0]) };
    const [entry, ...others] = index.chapters as [ChapterEntry, ...ChapterEntry[]];
    const summaries = entry.tasks?.map((task) =>
      task.id === long.id ? { ...task, steps: 10 } : task,
    );
    serveManual({
      'sign-in.json': { ...chapter, tasks: [long, ...rest] },
      'index.json': { ...index, chapters: [{ ...entry, tasks: summaries }, ...others] },
    });
    const stop = startKeyboard();
    show();
    const ninth = await screen.findByRole('button', { name: 'Paso 9' });
    expect(ninth.textContent).toBe('9');
    expect(screen.getByRole('button', { name: 'Paso 10' }).textContent).toBe('');
    stop();
  });
});
