import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { online } from '../../platform/server/api.ts';
import { waitSettings } from '../../platform/waiting.ts';
import { fakeServer } from '../../testing/fake-server.ts';
import { later } from '../../testing/later.ts';
import { Entrance } from './index.ts';
import { googleFailAfterMs } from './screens/Entrance/google/useGooglePhase.ts';
import { person } from './session.ts';
import { googleFrame, startReply } from './sign-in-test-kit.ts';

const start = startReply().body as Parameters<typeof Entrance>[0]['start'];

function open() {
  render(<Entrance start={start} onScan={vi.fn()} signInFirst={false} onStale={vi.fn()} />);
  return screen.getByRole('region', { name: 'Entrar' }).querySelector('.google') as HTMLElement;
}

describe('el lugar del botón de Google mientras carga («El hilo»)', () => {
  beforeEach(() => {
    localStorage.clear();
    person.set(undefined);
    fakeServer({ '/api/sign-in/codes': 'waiting' });
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    online.set(true);
  });

  it('sign-in R2.1, 00 · R7: nada antes de 300 ms, después el hilo, a los 2 s qué hace, y el botón sin saltos', async () => {
    const google = googleFrame();
    const place = open();
    expect(place.dataset.phase).toBe('empty');
    await later(waitSettings.markAfterMs);
    expect(place.dataset.phase).toBe('loading');
    await later(waitSettings.barAfterMs - waitSettings.markAfterMs);
    expect(place.dataset.phase).toBe('slow');
    expect(screen.getByText('Conectando con Google…')).toBeTruthy();
    google.drawn();
    expect(place.dataset.phase).toBe('ready');
    // Llegó después de verse el hilo: el hilo se completa y el botón se infla desde él.
    expect(place.classList.contains('arrived')).toBe(true);
  });

  it('si Google llega antes de 300 ms, no se ve nada más que el botón', async () => {
    const google = googleFrame();
    const place = open();
    google.drawn();
    expect(place.dataset.phase).toBe('ready');
    expect(place.classList.contains('arrived')).toBe(false);
    await later(googleFailAfterMs);
    expect(place.dataset.phase).toBe('ready');
  });

  it('a los 8 s sin el botón, «Google no responde · Reintentar», que carga Google de nuevo', async () => {
    googleFrame();
    const place = open();
    const frame = place.querySelector('iframe');
    await later(googleFailAfterMs);
    expect(place.dataset.phase).toBe('failed');
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    // Un marco nuevo, y la espera empieza de cero.
    expect(place.querySelector('iframe')).not.toBe(frame);
    expect(place.dataset.phase).toBe('empty');
    await later(waitSettings.markAfterMs);
    expect(place.dataset.phase).toBe('loading');
  });

  it('sin conexión lo dice, y al volver la conexión pide Google de nuevo', async () => {
    googleFrame();
    online.set(false);
    const place = open();
    expect(place.dataset.phase).toBe('offline');
    expect(screen.getByText('Sin internet, Google no carga')).toBeTruthy();
    await later(googleFailAfterMs);
    expect(place.dataset.phase).toBe('offline');
    const frame = place.querySelector('iframe');
    act(() => online.set(true));
    expect(place.querySelector('iframe')).not.toBe(frame);
    expect(place.dataset.phase).toBe('empty');
  });
});
