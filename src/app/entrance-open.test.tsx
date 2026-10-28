import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';
import { renewAfterMs } from './modules/sign-in/google/renew.ts';
import { person } from './modules/sign-in/session.ts';
import { googleFrame, startReply } from './modules/sign-in/sign-in-test-kit.ts';
import { store } from './platform/device/storage.ts';
import { navigate } from './platform/router.ts';
import { sessionClosed } from './platform/server/api.ts';
import { fakeServer } from './testing/fake-server.ts';
import { later } from './testing/later.ts';

describe('la entrada abierta', () => {
  beforeEach(() => {
    localStorage.clear();
    person.set(undefined);
    navigate('/', { replace: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionClosed.set(undefined);
  });

  it('sign-in R2.1: con la entrada abierta, un minuto antes de que venza pide solo un nonce nuevo y el botón lo usa', async () => {
    const google = googleFrame();
    const server = fakeServer({
      '/api/start': startReply(),
      '/api/sign-in/google/nonce': ['offline', { body: { nonce: 'n2' } }],
    });
    // El reloj de mentira desde antes de abrir: el intervalo se arma apenas llega el nonce.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<App />);
    await screen.findByRole('region', { name: 'Entrar' });
    google.ready();
    await waitFor(() => expect(google.shown).toHaveBeenCalled());
    // La primera vez sin conexión: sigue con el que tenía y vuelve a probar en el mismo plazo.
    await later(renewAfterMs);
    await later(renewAfterMs);
    google.ready();
    vi.useRealTimers();
    await waitFor(() =>
      expect(google.shown).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: 'show', nonce: 'n2' }),
        location.origin,
      ),
    );
    expect(server.sent.filter((s) => s.path === '/api/start')).toHaveLength(1);
  });

  it('sin nadie guardado, la entrada se dibuja sin esperar al servidor; con una salida pendiente, no', async () => {
    googleFrame();
    fakeServer({ '/api/start': 'waiting' });
    const { unmount } = render(<App />);
    // El servidor todavía no contestó (nunca contesta) y la entrada ya está.
    expect(screen.getByRole('region', { name: 'Entrar' })).toBeTruthy();
    unmount();
    store('pending-sign-out', { sessionId: 's', signature: 'f', tappedAt: 1 });
    render(<App />);
    expect(screen.queryByRole('region', { name: 'Entrar' })).toBeNull();
  });
});
