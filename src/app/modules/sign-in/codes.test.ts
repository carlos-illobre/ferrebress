import 'fake-indexeddb/auto';
import { act, renderHook, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeServer } from '../../testing/fake-server.ts';
import { hasPasskey, passkeyLinked, person } from './session.ts';
import { ana, fakePasskeys, signInReply, startReply } from './sign-in-test-kit.ts';
import { useComputerCode } from './useComputerCode.ts';
import { usePhoneCode } from './usePhoneCode.ts';

const sse = (...events: [string, unknown][]) =>
  events
    .map(
      ([type, data]) =>
        `event: ${type}\ndata: ${JSON.stringify({ type, ...(data as object) })}\n\n`,
    )
    .join('');

const reading = {
  secret: 's',
  computer: { label: 'Chrome en Windows' },
  holdSeconds: 120,
  authentication: { challenge: 'a' },
};

describe('la computadora espera que el celular lea su código', () => {
  beforeEach(() => {
    localStorage.clear();
    person.set(undefined);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sign-in-E12, E13: recibe el código, «leído», y al aprobar cambia el permiso por su sesión', async () => {
    const server = fakeServer({
      '/api/sign-in/codes': {},
      '/api/realtime/sign-in-codes': {
        stream: sse(
          ['code', { code: 'c1' }],
          ['read', {}],
          ['otro', {}],
          ['approved', { permit: 'p' }],
        ),
      },
      '/api/sign-in/codes/claim': signInReply(),
    });
    const { result, unmount } = renderHook(() => useComputerCode(true));
    await waitFor(() => expect(person.get()).toEqual(ana));
    expect(result.current).toMatchObject({ code: 'c1', read: true });
    expect(server.bodies('/api/sign-in/codes/claim')[0]).toMatchObject({ permit: 'p' });
    unmount();
  });

  it('si el celular dice «No soy yo», vuelve al código', async () => {
    fakeServer({
      '/api/sign-in/codes': {},
      '/api/realtime/sign-in-codes': [
        { stream: sse(['code', { code: 'c1' }], ['read', {}], ['cancelled', {}]) },
        'offline',
      ],
    });
    const { result, unmount } = renderHook(() => useComputerCode(true));
    await waitFor(() => expect(result.current).toMatchObject({ code: 'c1', read: false }));
    unmount();
  });

  it('sign-in-E18: con la pestaña escondida cierra el canal y lo vuelve a abrir al verse; apagado, no abre', async () => {
    let visibility = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
      () => visibility as DocumentVisibilityState,
    );
    const server = fakeServer({
      '/api/sign-in/codes': {},
      '/api/realtime/sign-in-codes': { stream: '' },
    });
    const { unmount } = renderHook(() => useComputerCode(true));
    await waitFor(() => expect(server.bodies('/api/sign-in/codes').length).toBeGreaterThan(0));
    visibility = 'hidden';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    const opened = server.sent.length;
    visibility = 'visible';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await waitFor(() => expect(server.sent.length).toBeGreaterThan(opened));
    unmount();
    renderHook(() => useComputerCode(false)).unmount();
    vi.restoreAllMocks();
  });
});

describe('el celular lee el código de una computadora', () => {
  beforeEach(() => {
    localStorage.clear();
    person.set(undefined);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sign-in-E13: con sesión pide la huella; puesta, entra la computadora', async () => {
    person.set(ana);
    fakePasskeys();
    const server = fakeServer({
      '/api/sign-in/codes/read': { body: reading },
      '/api/sign-in/codes/approve': {},
    });
    const { result } = renderHook(() => usePhoneCode());
    await act(() => result.current.scanned('c1'));
    expect(result.current.state).toMatchObject({ step: 'ask' });
    await act(() => result.current.touch());
    expect(result.current.state).toEqual({ step: 'none' });
    expect(server.bodies('/api/sign-in/codes/approve')[0]).toEqual({
      secret: 's',
      kind: 'assertion',
      response: { id: 'credencial' },
    });
    expect(hasPasskey()).toBe(true);
  });

  it('sign-in-E16: sin sesión y con la huella, una sola huella hace entrar a los dos', async () => {
    passkeyLinked();
    fakePasskeys();
    const server = fakeServer({
      '/api/sign-in/codes/read': { body: reading },
      '/api/sign-in/codes/approve': {},
      '/api/start': [startReply({ person: ana }), 'offline'],
    });
    const { result } = renderHook(() => usePhoneCode());
    await act(() => result.current.scanned('c1'));
    await act(() => result.current.touch());
    expect(server.bodies('/api/sign-in/codes/approve')[0]).toHaveProperty('proofPublicKey');
    expect(person.get()).toEqual(ana);
    act(() => person.set(undefined));
    await act(() => result.current.scanned('c1'));
    await act(() => result.current.touch());
    expect(result.current.state).toEqual({ step: 'none' });
    expect(person.get()).toBeUndefined();
  });

  it('sign-in-E16b: sin sesión ni huella, primero entra con Google, después lee y vincula la huella', async () => {
    fakePasskeys();
    const server = fakeServer({
      '/api/sign-in/codes/read': { body: { ...reading, registration: { challenge: 'r' } } },
      '/api/sign-in/codes/approve': {},
    });
    const { result } = renderHook(() => usePhoneCode());
    await act(() => result.current.scanned('c1'));
    expect(result.current.state).toEqual({ step: 'sign-in-first', code: 'c1' });
    act(() => person.set(ana));
    await waitFor(() => expect(result.current.state).toMatchObject({ step: 'ask' }));
    await act(() => result.current.touch());
    expect(server.bodies('/api/sign-in/codes/approve')[0]).toMatchObject({ kind: 'registration' });
  });

  it('sign-in-E16b: con sesión y sin huella, si el servidor lo pide, lee recién cuando vuelve a entrar con Google', async () => {
    person.set(ana);
    fakeServer({
      '/api/sign-in/codes/read': [
        { status: 409, body: { error: 'sign-in-first' } },
        { body: { ...reading, registration: {} } },
      ],
    });
    const { result } = renderHook(() => usePhoneCode());
    await act(() => result.current.scanned('c1'));
    expect(result.current.state).toMatchObject({ step: 'sign-in-first', code: 'c1' });
    act(() => person.set({ ...ana }));
    await waitFor(() => expect(result.current.state).toMatchObject({ step: 'ask' }));
  });

  it('sign-in-E16c: si no pone la huella, suelta el código y dice que la computadora puede entrar con Google', async () => {
    person.set(ana);
    fakePasskeys({ cancel: true });
    const server = fakeServer({
      '/api/sign-in/codes/read': { body: { ...reading, registration: {} } },
      '/api/sign-in/codes/cancel': {},
    });
    const { result } = renderHook(() => usePhoneCode());
    await act(() => result.current.scanned('c1'));
    await act(() => result.current.touch());
    expect(result.current.state).toEqual({ step: 'no-passkey' });
    expect(server.bodies('/api/sign-in/codes/cancel')).toEqual([{ secret: 's' }]);
    fakeServer({ '/api/sign-in/codes/read': { body: reading }, '/api/sign-in/codes/cancel': {} });
    await act(() => result.current.scanned('c2'));
    await act(() => result.current.touch());
    expect(result.current.state).toEqual({ step: 'no-passkey' });
  });

  it('sign-in-E13b, E14: en otra red, o con un código vencido o usado, no pide la huella', async () => {
    person.set(ana);
    fakeServer({
      '/api/sign-in/codes/read': [
        { status: 409, body: { error: 'other-network' } },
        { status: 410, body: { error: 'code-used' } },
        'offline',
      ],
    });
    const { result } = renderHook(() => usePhoneCode());
    await act(() => result.current.scanned('c1'));
    expect(result.current.state).toEqual({ step: 'other-network' });
    await act(() => result.current.scanned('c2'));
    expect(result.current.state).toEqual({ step: 'expired' });
    await act(() => result.current.scanned('c3'));
    expect(result.current.state).toEqual({ step: 'none' });
  });

  it('al aprobar puede resultar otra red o vencido; «No soy yo» suelta el código', async () => {
    person.set(ana);
    fakePasskeys();
    const server = fakeServer({
      '/api/sign-in/codes/read': { body: reading },
      '/api/sign-in/codes/approve': [
        { status: 409, body: { error: 'other-network' } },
        { status: 410, body: { error: 'code-expired' } },
      ],
      '/api/sign-in/codes/cancel': {},
    });
    const { result } = renderHook(() => usePhoneCode());
    await act(() => result.current.scanned('c1'));
    await act(() => result.current.touch());
    expect(result.current.state).toEqual({ step: 'other-network' });
    await act(() => result.current.touch());
    await act(() => result.current.scanned('c1'));
    await act(() => result.current.touch());
    expect(result.current.state).toEqual({ step: 'expired' });
    await act(() => result.current.scanned('c1'));
    await act(() => result.current.notMe());
    await act(() => result.current.notMe());
    expect(server.bodies('/api/sign-in/codes/cancel')).toEqual([{ secret: 's' }]);
    expect(result.current.state).toEqual({ step: 'none' });
  });
});
