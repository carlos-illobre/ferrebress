import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';
import { scan } from './modules/sign-in/codes/scanner.ts';
import { person } from './modules/sign-in/session.ts';
import {
  ana,
  googleFrame,
  phone,
  signInReply,
  startReply,
} from './modules/sign-in/sign-in-test-kit.ts';
import { store } from './platform/device/storage.ts';
import { navigate } from './platform/router.ts';
import { newVersion, sessionClosed } from './platform/server/api.ts';
import { fakeServer } from './testing/fake-server.ts';
import { later } from './testing/later.ts';

vi.mock('./modules/sign-in/codes/scanner.ts', () => ({ scan: vi.fn(), scanEveryMs: 250 }));

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
    googleFrame();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionClosed.set(undefined);
  });

  it('sign-in-E36: manda primero la salida pendiente; sin sesión, muestra la entrada', async () => {
    store('pending-sign-out', { sessionId: 'x', signature: 'y' });
    const server = fakeServer({ '/api/sign-out': {}, '/api/start': startReply() });
    render(<App />);
    expect(await screen.findByRole('region', { name: 'Entrar' })).toBeTruthy();
    expect(server.sent.map((s) => s.path).slice(0, 2)).toEqual(['/api/sign-out', '/api/start']);
  });

  it('app-E01, sign-in-E35: con sesión abre el marco; «Salir» vuelve a la entrada con un nonce nuevo', async () => {
    const server = fakeServer({
      '/api/start': [startReply({ person: ana }), startReply({ googleNonce: 'otro' })],
      '/api/sign-out': {},
    });
    render(<App />);
    const card = await screen.findByRole('region', { name: 'Tu sesión' });
    fireEvent.click(card.querySelector('button') as Element);
    expect(await screen.findByRole('region', { name: 'Entrar' })).toBeTruthy();
    await waitFor(() => expect(server.bodies('/api/start')).toHaveLength(2));
  });

  it('R3.6, sign-in-E28, app-E51: sin conexión al abrir sigue con quién estaba, con el marco de pruebas, aunque pasen horas', async () => {
    person.set(ana);
    store('environment', 'testing');
    fakeServer({ '/api/start': 'offline' });
    render(<App />);
    expect(await screen.findByRole('region', { name: 'Tu sesión' })).toBeTruthy();
    expect(document.querySelector('.test-frame')).not.toBeNull();
    vi.useFakeTimers();
    await later(9 * 60 * 60_000);
    vi.useRealTimers();
    expect(screen.getByRole('region', { name: 'Tu sesión' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Entrar' })).toBeNull();
  });

  it('R3.6: si el servidor no contesta JSON (un despliegue), sigue como sin conexión', async () => {
    person.set(ana);
    fakeServer({ '/api/start': { stream: '<html>502</html>' } });
    render(<App />);
    expect(await screen.findByRole('region', { name: 'Tu sesión' })).toBeTruthy();
  });

  it('R3.6, sign-in-E28b: al volver la conexión el servidor revisa la sesión; vencida, la entrada aparece encima', async () => {
    googleFrame();
    const server = fakeServer({
      '/api/start': [startReply({ person: ana }), startReply({ person: ana }), startReply()],
    });
    render(<App />);
    await screen.findByRole('region', { name: 'Tu sesión' });
    const back = () =>
      act(() => {
        dispatchEvent(new Event('online'));
      });
    back();
    await waitFor(() => expect(server.bodies('/api/start')).toHaveLength(2));
    expect(screen.queryByText('Tu sesión venció')).toBeNull();
    back();
    expect(await screen.findByText('Tu sesión venció')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Tu sesión' })).toBeTruthy();
  });

  it('app-E23: abierta y sin usarse, no le pide nada al servidor', async () => {
    // Como queda un dispositivo con sesión: la persona guardada.
    person.set(ana);
    const server = fakeServer({ '/api/start': startReply({ person: ana }) });
    render(<App />);
    await screen.findByRole('region', { name: 'Tu sesión' });
    vi.useFakeTimers();
    await later(2 * 60 * 60_000);
    vi.useRealTimers();
    expect(server.sent).toHaveLength(1);
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

  it('sin sesión, al volver la conexión no pregunta por ninguna', async () => {
    googleFrame();
    const server = fakeServer({ '/api/start': startReply() });
    render(<App />);
    await screen.findByRole('region', { name: 'Entrar' });
    act(() => {
      dispatchEvent(new Event('online'));
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(server.bodies('/api/start')).toHaveLength(1);
  });

  it('sign-in-E16b: sin sesión ni huella, al leer el QR entra con Google y solo se abre la hoja de vincular', async () => {
    navigate('/link#c1', { replace: true });
    phone();
    const google = googleFrame();
    fakeServer({
      '/api/start': startReply(),
      '/api/sign-in/google': signInReply(true),
      '/api/sign-in/codes/read': { body: { ...reading, registration: {} } },
    });
    render(<App />);
    expect(
      await screen.findByText('Entrá en este celular para que entre la computadora'),
    ).toBeTruthy();
    // El marco avisa que está listo cuando cargó, después de que la entrada lo escucha.
    await waitFor(() => {
      google.ready();
      expect(google.shown).toHaveBeenCalled();
    });
    google.credential('pase');
    expect(await screen.findByText('Vinculá tu huella para entrar a la computadora')).toBeTruthy();
    expect(screen.queryByText('¿Entrar con la huella la próxima vez?')).toBeNull();
  });

  it('R3.4: si la sesión se cierra, la entrada aparece encima del marco y se va al volver a entrar', async () => {
    const google = googleFrame();
    fakeServer({ '/api/start': startReply({ person: ana }), '/api/sign-in/google': signInReply() });
    render(<App />);
    await screen.findByRole('region', { name: 'Tu sesión' });
    act(() => sessionClosed.set('revoked'));
    expect(await screen.findByRole('region', { name: 'Entrar' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Tu sesión' })).toBeTruthy();
    google.ready();
    await waitFor(() => expect(google.shown).toHaveBeenCalled());
    google.credential('pase');
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Entrar' })).toBeNull());
    expect(sessionClosed.get()).toBeUndefined();
  });

  it('sign-in-E13: la dirección del QR abre la hoja del código y se borra de la dirección', async () => {
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

  it('app-E27: recién abierta, con una versión nueva en el servidor, se actualiza antes de usarse', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...location, reload });
    sessionStorage.clear();
    fakeServer({ '/api/start': startReply({ person: ana }) });
    newVersion.set(true);
    render(<App />);
    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
    expect(screen.queryByRole('region', { name: 'Tu sesión' })).toBeNull();
    newVersion.set(false);
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
