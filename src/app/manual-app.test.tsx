// El manual dentro de la aplicación (diseño del manual, § 5): se abre encima de todo, con sesión o
// sin ella; el marco queda debajo, oculto y sin tocarse; la entrada se desmonta; «Volver» vuelve.
import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App.tsx';
import { chapter, index, media } from './modules/manual/manual-test-kit.tsx';
import { person } from './modules/sign-in/session.ts';
import { ana, googleFrame, startReply } from './modules/sign-in/sign-in-test-kit.ts';
import { navigate } from './platform/router.ts';
import { sessionClosed } from './platform/server/api.ts';
import { fakeServer } from './testing/fake-server.ts';

const manualFiles = {
  '/manual/index.json': { body: index },
  '/manual/sign-in.json': { body: chapter },
};

describe('el manual en la aplicación', () => {
  beforeEach(() => {
    localStorage.clear();
    person.set(undefined);
    navigate('/', { replace: true });
    googleFrame();
    media();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionClosed.set(undefined);
  });

  it('app-E33, E53: desde Más se abre encima del marco, que queda oculto; no muestra a la persona', async () => {
    person.set(ana);
    const { sent } = fakeServer({ '/api/start': startReply({ person: ana }), ...manualFiles });
    render(<App />);
    await screen.findByRole('region', { name: 'Tu sesión' });
    const before = sent.length;
    fireEvent.click(screen.getAllByRole('button', { name: /^Más/ })[0] as HTMLElement);
    fireEvent.click(await screen.findByRole('button', { name: /Manual/ }));
    expect(location.pathname).toBe('/manual');
    expect(history.state).toEqual({ from: 'users' });
    const page = (await screen.findByRole('heading', { name: '¿Qué querés hacer?' })).closest(
      '.manual-page',
    ) as HTMLElement;
    const behind = document.querySelector('.behind-manual') as HTMLElement;
    expect(behind.hidden).toBe(true);
    expect(behind.hasAttribute('inert')).toBe(true);
    expect(within(page).queryByText(ana.name)).toBeNull();
    // Con la sesión abierta, todo lo que pide el manual sale de /manual/.
    const asked = sent.slice(before).map((one) => one.path);
    expect(asked.length).toBeGreaterThan(0);
    expect(asked.every((path) => path.startsWith('/manual/'))).toBe(true);
    const back = vi.spyOn(history, 'go').mockImplementation(() => navigate('/', { replace: true }));
    fireEvent.click(within(page).getByRole('button', { name: /Volver a Usuarios/ }));
    expect(back).toHaveBeenCalledWith(-1);
    await waitFor(() => expect(document.querySelector('.manual-page')).toBeNull());
    expect(behind.hidden).toBe(false);
  });

  it('app-E32, app-E37: sin sesión, la entrada se desmonta mientras el manual está abierto; «Volver» vuelve a ella', async () => {
    fakeServer({ '/api/start': startReply(), ...manualFiles });
    render(<App />);
    await screen.findByRole('region', { name: 'Entrar' });
    fireEvent.click(screen.getByRole('button', { name: /Ver el manual/ }));
    await screen.findByRole('heading', { name: '¿Qué querés hacer?' });
    expect(screen.queryByRole('region', { name: 'Entrar' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Volver a la entrada/ }));
    expect(await screen.findByRole('region', { name: 'Entrar' })).toBeTruthy();
    expect(location.pathname).toBe('/');
  });

  it('si la sesión se cierra con el manual abierto, la entrada aparece recién al volver', async () => {
    person.set(ana);
    fakeServer({ '/api/start': startReply({ person: ana }), ...manualFiles });
    render(<App />);
    await screen.findByRole('region', { name: 'Tu sesión' });
    navigate('/manual', { state: { from: 'more' } });
    await screen.findByRole('heading', { name: '¿Qué querés hacer?' });
    act(() => {
      person.set(undefined);
      sessionClosed.set('expired');
    });
    expect(screen.queryByRole('region', { name: 'Entrar' })).toBeNull();
    expect(screen.getByRole('heading', { name: '¿Qué querés hacer?' })).toBeTruthy();
    navigate('/', { replace: true });
    expect(await screen.findByRole('region', { name: 'Entrar' })).toBeTruthy();
  });

  it('abierto escribiendo la dirección, «Ir a Ferrebress» lleva al principio', async () => {
    navigate('/manual', { replace: true, state: null });
    history.replaceState(null, '', '/manual');
    fakeServer({ '/api/start': startReply(), ...manualFiles });
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: /Ir a Ferrebress/ }));
    expect(location.pathname).toBe('/');
  });

  it('app-E34: abierto en el celular, está elegido Celular', async () => {
    Object.defineProperty(navigator, 'userAgentData', {
      configurable: true,
      get: () => ({ mobile: true }),
    });
    navigate('/manual', { replace: true, state: { from: 'more' } });
    fakeServer({ '/api/start': startReply(), ...manualFiles });
    render(<App />);
    expect((await screen.findAllByRole('button', { name: /Celular/, pressed: true })).length).toBe(
      2,
    );
    expect(screen.getAllByRole('button', { name: /Más/ }).length).toBeGreaterThan(0);
    Reflect.deleteProperty(navigator, 'userAgentData');
  });
});
