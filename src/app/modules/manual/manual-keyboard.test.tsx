// El teclado en el manual (00 · R2.8): todo botón tiene su atajo, también los segmentos del avance y
// el que vuelve a pasar el clip.
import type { ChapterEntry, Task } from '@ferrebress/shared/contracts/manual';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startKeyboard } from '../../platform/keyboard.ts';
import { chapter, index, media, serveManual, show } from './manual-test-kit.tsx';

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
    const first = document.querySelector('video') as HTMLVideoElement;
    fireEvent(first, new Event('ended'));
    alt('KeyV');
    expect(play).toHaveBeenCalledTimes(2);
    expect(document.querySelector('video')).not.toBe(first);
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
    show();
    const ninth = await screen.findByRole('button', { name: 'Paso 9' });
    expect(ninth.textContent).toBe('9');
    expect(screen.getByRole('button', { name: 'Paso 10' }).textContent).toBe('');
  });
});
