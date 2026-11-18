import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { online } from '../../platform/server/api.ts';
import { platformSettings } from '../../platform/settings.ts';
import { fakeServer } from '../../testing/fake-server.ts';
import { later } from '../../testing/later.ts';
import { Entrance } from '../../views/basic/sign-in/index.ts';
import { person } from './session.ts';
import { signInSettings } from './settings.ts';
import { arrivedLate, googleFrame, googlePlace, one, startReply } from './sign-in-test-kit.ts';

const start = startReply().body as Parameters<typeof Entrance>[0]['start'];

function open() {
  render(<Entrance start={start} onScan={vi.fn()} signInFirst={false} onStale={vi.fn()} />);
  return googlePlace();
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

  it('sign-in R2.1, 00 · R7: nada antes de 300 ms, después el hilo, pasado 1 s qué hace, y el botón sin saltos', async () => {
    const google = googleFrame();
    const place = open();
    expect(place.dataset.phase).toBe('empty');
    await later(platformSettings.waiting.markAfterMs);
    expect(place.dataset.phase).toBe('loading');
    await later(platformSettings.waiting.barAfterMs - platformSettings.waiting.markAfterMs);
    expect(place.dataset.phase).toBe('slow');
    expect(screen.getByText('Conectando con Google…')).toBeTruthy();
    google.drawn();
    expect(place.dataset.phase).toBe('ready');
    // Llegó después de verse el hilo: el hilo se completa y el botón se infla desde él.
    expect(arrivedLate(place)).toBe(true);
  });

  it('si Google llega antes de 300 ms, no se ve nada más que el botón', async () => {
    const google = googleFrame();
    const place = open();
    google.drawn();
    expect(place.dataset.phase).toBe('ready');
    expect(arrivedLate(place)).toBe(false);
    await later(signInSettings.google.failAfterMs);
    expect(place.dataset.phase).toBe('ready');
  });

  it('a los 8 s sin el botón, «Google no responde · Reintentar», que carga Google de nuevo', async () => {
    googleFrame();
    const place = open();
    const frame = one('googleFrameElement', place);
    await later(signInSettings.google.failAfterMs);
    expect(place.dataset.phase).toBe('failed');
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    // Un marco nuevo, y la espera empieza de cero.
    expect(one('googleFrameElement', place)).not.toBe(frame);
    expect(place.dataset.phase).toBe('empty');
    await later(platformSettings.waiting.markAfterMs);
    expect(place.dataset.phase).toBe('loading');
  });

  it('sin conexión lo dice, y al volver la conexión pide Google de nuevo', async () => {
    googleFrame();
    online.set(false);
    const place = open();
    expect(place.dataset.phase).toBe('offline');
    expect(screen.getByText('Sin internet, Google no carga')).toBeTruthy();
    await later(signInSettings.google.failAfterMs);
    expect(place.dataset.phase).toBe('offline');
    const frame = one('googleFrameElement', place);
    act(() => online.set(true));
    expect(one('googleFrameElement', place)).not.toBe(frame);
    expect(place.dataset.phase).toBe('empty');
  });
});
