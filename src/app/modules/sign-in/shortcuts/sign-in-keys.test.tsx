// La entrada con los atajos (01 · R7.1, R7.2): «Ver el manual» y «Reintentar» Google muestran su
// tecla del mapa (keyboard/shortcuts/keymap.ts) y responden a ella.
import 'fake-indexeddb/auto';
import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeServer } from '../../../testing/fake-server.ts';
import { startKeyboard } from '../../../testing/keyboard.ts';
import { later } from '../../../testing/later.ts';
import { Entrance } from '../../../views/basic/sign-in/index.ts';
import { person } from '../session.ts';
import { signInSettings } from '../settings.ts';
import { googleFrame, startReply } from '../sign-in-test-kit.ts';

const start = startReply().body as Parameters<typeof Entrance>[0]['start'];
const alt = (letter: string) =>
  fireEvent.keyDown(window, { key: letter, code: `Key${letter}`, altKey: true });

describe('la entrada con los atajos', () => {
  let stop: () => void;
  beforeEach(() => {
    localStorage.clear();
    person.set(undefined);
    fakeServer({ '/api/sign-in/codes': 'waiting' });
    vi.useFakeTimers();
    stop = startKeyboard();
  });
  afterEach(() => {
    stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('app-E12: «Ver el manual» muestra su tecla y Alt M lo abre', () => {
    googleFrame();
    render(<Entrance start={start} onScan={vi.fn()} signInFirst={false} onStale={vi.fn()} />);
    const manual = screen.getByRole('button', { name: /Ver el manual/ });
    expect(manual.querySelector('kbd')?.textContent).toBe('M');
    alt('M');
    expect(location.pathname).toBe('/manual');
  });

  it('app-E12: Google que no cargó muestra «Reintentar» con su tecla, y Alt R lo carga de nuevo', async () => {
    googleFrame();
    render(<Entrance start={start} onScan={vi.fn()} signInFirst={false} onStale={vi.fn()} />);
    const place = screen
      .getByRole('region', { name: 'Entrar' })
      .querySelector('.google') as HTMLElement;
    await later(signInSettings.google.failAfterMs);
    expect(place.dataset.phase).toBe('failed');
    const retry = screen.getByRole('button', { name: /Reintentar/ });
    expect(retry.querySelector('kbd')?.textContent).toBe('R');
    alt('R');
    expect(place.dataset.phase).toBe('empty');
  });
});
