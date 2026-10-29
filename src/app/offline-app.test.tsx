import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';
import { eva, resetOffline } from './modules/sign-in/offline/offline-kit.ts';
import { contacted } from './modules/sign-in/offline/option.ts';
import { addEntry, entries } from './modules/sign-in/offline/pending.ts';
import { offlineSession, person } from './modules/sign-in/session.ts';
import { googleFrame, startReply } from './modules/sign-in/sign-in-test-kit.ts';
import { store } from './platform/device/storage.ts';
import { fakeServer } from './testing/fake-server.ts';

vi.mock('./modules/sign-in/codes/scanner.ts', () => ({ scan: vi.fn(), scanEveryMs: 250 }));

// Una sesión abierta sin conexión, con su entrada por confirmar.
function enteredOffline() {
  const entry = {
    id: 'e1',
    userId: eva.userId,
    signedAt: '2026-10-29T08:00:00.000Z',
    lastContactAt: '2026-10-29T07:00:00.000Z',
    response: {},
    proofPublicKey: 'p',
    ended: false,
  };
  addEntry(entry);
  contacted(Date.now());
  store('session', { offlineId: entry.id, person: eva });
  person.set(eva);
}

const confirmedReply = { body: { person: eva, sessionId: 's1', offerPasskey: false } };

describe('la aplicación con una entrada sin conexión por confirmar', () => {
  beforeEach(() => {
    resetOffline();
    googleFrame();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('offline-R2.7: al abrir, si el servidor todavía no la confirma, la sesión sigue', async () => {
    enteredOffline();
    const server = fakeServer({
      '/api/sign-in/offline': { status: 429, body: { error: 'too-many-attempts' } },
      '/api/start': startReply(),
    });
    render(<App />);
    expect(await screen.findByRole('region', { name: 'Tu sesión' })).toBeTruthy();
    expect(server.sent.map((sent) => sent.path).slice(0, 2)).toEqual([
      '/api/sign-in/offline',
      '/api/start',
    ]);
    expect(person.get()).toEqual(eva);
    expect(offlineSession()).toBe('e1');
  });

  it('offline-E15: sin red, vuelve a probar sola, también con el marco, hasta confirmarla', async () => {
    enteredOffline();
    vi.stubGlobal('navigator', { ...navigator, onLine: true });
    const server = fakeServer({
      '/api/sign-in/offline': ['offline', confirmedReply],
      '/api/start': ['offline', startReply({ person: eva })],
    });
    render(<App />);
    expect(await screen.findByRole('region', { name: 'Tu sesión' })).toBeTruthy();
    await waitFor(() => expect(entries()).toEqual([]), { timeout: 4000 });
    expect(server.bodies('/api/sign-in/offline')).toHaveLength(2);
    expect(offlineSession()).toBeUndefined();
  });

  it('offline-R3.2: la entrada que el servidor no confirmó sigue encima al recargar', async () => {
    store('session', { person: eva, closedReason: 'offline-not-confirmed' });
    person.set(eva);
    fakeServer({ '/api/start': startReply(), '/api/sign-in/codes': 'offline' });
    render(<App />);
    expect(await screen.findByText('No se pudo confirmar tu entrada sin conexión')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Tu sesión' })).toBeTruthy();
  });
});
