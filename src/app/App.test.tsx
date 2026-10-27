import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';
import { scan } from './modules/sign-in/scanner.ts';
import { person } from './modules/sign-in/session.ts';
import {
  ana,
  googleScript,
  phone,
  signInReply,
  startReply,
} from './modules/sign-in/sign-in-test-kit.ts';
import { sessionClosed } from './platform/api.ts';
import { navigate } from './platform/router.ts';
import { store } from './platform/storage.ts';
import { fakeServer } from './testing/fake-server.ts';

vi.mock('./modules/sign-in/scanner.ts', () => ({ scan: vi.fn(), scanEveryMs: 250 }));

const reading = {
  secret: 's',
  computer: { label: 'Chrome en Windows' },
  holdSeconds: 120,
  authentication: {},
};

describe('la aplicación al abrir', () => {
  beforeEach(() => {
    localStorage.clear();
    person.set(undefined);
    navigate('/', { replace: true });
    googleScript();
    vi.stubGlobal('PublicKeyCredential', {
      getClientCapabilities: async () => ({ hybridTransport: true }),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionClosed.set(undefined);
  });

  it('01-E36: manda primero la salida pendiente; sin sesión, muestra la entrada', async () => {
    store('pending-sign-out', { sessionId: 'x', signature: 'y' });
    const server = fakeServer({ '/api/sign-out': {}, '/api/start': startReply() });
    render(<App />);
    expect(await screen.findByRole('region', { name: 'Entrar' })).toBeTruthy();
    expect(server.sent.map((s) => s.path).slice(0, 2)).toEqual(['/api/sign-out', '/api/start']);
  });

  it('app-E01, 01-E35: con sesión abre el marco; «Salir» vuelve a la entrada', async () => {
    fakeServer({ '/api/start': startReply({ person: ana }), '/api/sign-out': {} });
    render(<App />);
    const card = await screen.findByRole('region', { name: 'Tu sesión' });
    fireEvent.click(card.querySelector('button') as Element);
    expect(await screen.findByRole('region', { name: 'Entrar' })).toBeTruthy();
  });

  it('R3.6: sin conexión al abrir sigue con quién estaba guardado, sin el marco de pruebas', async () => {
    person.set(ana);
    fakeServer({ '/api/start': 'offline' });
    render(<App />);
    expect(await screen.findByRole('region', { name: 'Tu sesión' })).toBeTruthy();
    expect(document.querySelector('.test-frame')).toBeNull();
  });

  it('R3.4: si la sesión se cierra, la entrada aparece encima del marco y se va al volver a entrar', async () => {
    const google = googleScript();
    fakeServer({ '/api/start': startReply({ person: ana }), '/api/sign-in/google': signInReply() });
    render(<App />);
    await screen.findByRole('region', { name: 'Tu sesión' });
    act(() => sessionClosed.set('revoked'));
    expect(await screen.findByRole('region', { name: 'Entrar' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Tu sesión' })).toBeTruthy();
    google.load();
    await waitFor(() => expect(google.id.initialize).toHaveBeenCalled());
    act(() => google.id.initialize.mock.calls.at(-1)?.[0].callback({ credential: 'pase' }));
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Entrar' })).toBeNull());
    expect(sessionClosed.get()).toBeUndefined();
  });

  it('01-E13: la dirección del QR abre la hoja del código y se borra de la dirección', async () => {
    navigate('/link#c1', { replace: true });
    fakeServer({
      '/api/start': startReply({ person: ana }),
      '/api/sign-in/codes/read': { body: reading },
    });
    render(<App />);
    expect(await screen.findByText('¿Entrar en Chrome en Windows?')).toBeTruthy();
    expect(location.pathname + location.hash).toBe('/');
  });

  it('«Escanear» abre la cámara; lo leído sigue como la dirección del QR, y la × la cierra', async () => {
    phone();
    let read = (_: string) => {};
    vi.mocked(scan).mockImplementation(async (_video, onText) => {
      read = onText;
      return () => {};
    });
    navigate('/link', { replace: true });
    fakeServer({ '/api/start': startReply(), '/api/sign-in/codes/read': { body: reading } });
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /Escanear el código/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog', { name: 'Escanear el código' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Escanear el código/ }));
    await waitFor(() => expect(scan).toHaveBeenCalledTimes(2));
    act(() => read(`${location.origin}/link#c9`));
    expect(
      await screen.findByText('Entrá en este celular para que entre la computadora'),
    ).toBeTruthy();
  });

  it('cuando vuelve la red, manda la salida pendiente', async () => {
    fakeServer({ '/api/start': startReply() });
    const { unmount } = render(<App />);
    await screen.findByRole('region', { name: 'Entrar' });
    store('pending-sign-out', { sessionId: 'x', signature: 'y' });
    const server = fakeServer({ '/api/sign-out': {} });
    act(() => {
      dispatchEvent(new Event('online'));
    });
    await waitFor(() => expect(server.bodies('/api/sign-out')).toHaveLength(1));
    unmount();
  });
});
