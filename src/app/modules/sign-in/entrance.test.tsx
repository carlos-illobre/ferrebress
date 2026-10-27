import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { online, sessionClosed } from '../../platform/api.ts';
import { fakeServer } from '../../testing/fake-server.ts';
import { later } from '../../testing/later.ts';
import { Entrance } from './index.ts';
import { person } from './session.ts';
import {
  ana,
  fakePasskeys,
  googleFrame,
  phone,
  signInReply,
  startReply,
} from './sign-in-test-kit.ts';

const start = startReply().body as Parameters<typeof Entrance>[0]['start'];

function open({ signInFirst = false, onScan = vi.fn(), onStale = vi.fn() } = {}) {
  render(<Entrance start={start} onScan={onScan} signInFirst={signInFirst} onStale={onStale} />);
  return { onScan, onStale, card: screen.getByRole('region', { name: 'Entrar' }) };
}

describe('la entrada en la computadora', () => {
  beforeEach(() => {
    localStorage.clear();
    person.set(undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    online.set(true);
    sessionClosed.set(undefined);
  });

  it('01-E38, E12: muestra el código QR con sus pasos, Google y la nota, en el ambiente de pruebas', async () => {
    googleFrame();
    fakeServer({
      '/api/sign-in/codes': {},
      '/api/realtime/sign-in-codes': [
        { stream: 'event: code\ndata: {"code":"c1"}\n\nevent: read\ndata: {}\n\n' },
        'offline',
      ],
    });
    const { card } = open();
    await waitFor(() => expect(card.querySelector('.qr svg path')).not.toBeNull());
    expect(
      within(card).getByRole('img', { name: 'Código para entrar con el celular' }),
    ).toBeTruthy();
    expect(within(card).getByText('Apuntá el celular a este código')).toBeTruthy();
    await waitFor(() => expect(card.querySelector('.qr.read')).not.toBeNull());
    await waitFor(() => expect(within(card).getByText(/Cambia en/).textContent).toContain('0:59'), {
      timeout: 4000,
    });
    expect(card.querySelector('.note')).not.toBeNull();
    expect(document.querySelector('.test-banner')).not.toBeNull();
    expect(screen.getByText('En línea')).toBeTruthy();
  });

  it('01-E17: muestra el QR de Ferrebress y nunca la entrada del navegador con un celular cercano', async () => {
    googleFrame();
    const credentials = fakePasskeys();
    fakeServer({
      '/api/sign-in/codes': {},
      '/api/realtime/sign-in-codes': { stream: 'event: code\ndata: {"code":"c1"}\n\n' },
    });
    const { card } = open();
    await waitFor(() => expect(card.querySelector('.qr svg path')).not.toBeNull());
    expect(within(card).queryByRole('button', { name: /Entrar con el celular/ })).toBeNull();
    expect(credentials.get).not.toHaveBeenCalled();
  });

  it('01-E05: Google dibuja su botón y, con el pase, entra', async () => {
    const google = googleFrame();
    fakeServer({
      '/api/sign-in/codes': {},
      '/api/realtime/sign-in-codes': { stream: '' },
      '/api/sign-in/google': signInReply(),
    });
    open();
    google.ready();
    await waitFor(() =>
      expect(google.shown).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'show', nonce: 'nonce' }),
        location.origin,
      ),
    );
    const place = document.querySelector('.google') as HTMLElement;
    expect(place.hasAttribute('data-drawn')).toBe(false);
    google.drawn();
    expect(place.hasAttribute('data-drawn')).toBe(true);
    google.credential('pase');
    await waitFor(() => expect(person.get()).toEqual(ana));
  });

  it('si el pase de Google llegó con un nonce vencido, pide otro y dice que se toque Google otra vez', async () => {
    const google = googleFrame();
    fakeServer({
      '/api/sign-in/codes': {},
      '/api/realtime/sign-in-codes': { stream: '' },
      '/api/sign-in/google': { status: 401, body: { error: 'sign-in-expired' } },
    });
    const { onStale } = open();
    google.ready();
    await waitFor(() => expect(google.shown).toHaveBeenCalled());
    google.credential('pase');
    expect(await screen.findByText(/Pasó mucho tiempo desde que se abrió la entrada/)).toBeTruthy();
    expect(onStale).toHaveBeenCalledOnce();
  });

  it('01-E02: una cuenta no autorizada ve por qué, y la nota se va', async () => {
    const google = googleFrame();
    fakeServer({
      '/api/sign-in/codes': {},
      '/api/realtime/sign-in-codes': { stream: '' },
      '/api/sign-in/google': { status: 403, body: { error: 'not-authorized', email: 'x@y.com' } },
    });
    open();
    google.ready();
    await waitFor(() => expect(google.shown).toHaveBeenCalled());
    google.credential('pase');
    expect(
      await screen.findByText(
        'Esta cuenta (x@y.com) no está autorizada. Pedile a un Administrador que agregue tu correo.',
      ),
    ).toBeTruthy();
  });

  it('01-E19: sin conexión los botones se apagan y dice que hace falta internet', () => {
    googleFrame();
    fakeServer({ '/api/sign-in/codes': 'offline', '/api/realtime/sign-in-codes': 'offline' });
    online.set(false);
    open();
    expect(screen.getByText('Para entrar hace falta internet')).toBeTruthy();
    expect(document.querySelector('.google')?.classList.contains('off')).toBe(true);
    expect(screen.getByText('Sin conexión')).toBeTruthy();
  });

  it('R3.4: si la sesión se cerró, lo dice arriba; si venció, dice que venció', async () => {
    googleFrame();
    const server = fakeServer({});
    sessionClosed.set('revoked');
    open();
    await waitFor(() => expect(server.sent.length).toBeGreaterThan(0));
    expect(screen.getByText('Tu sesión se cerró desde otro dispositivo')).toBeTruthy();
    act(() => sessionClosed.set('idle'));
    expect(screen.getByText('Tu sesión venció')).toBeTruthy();
  });
});

describe('la entrada en el celular', () => {
  beforeEach(() => {
    localStorage.clear();
    person.set(undefined);
    phone();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('01-E38: Google, la huella y «Escanear», sin QR; con sesión, Google no se dibuja', () => {
    const google = googleFrame();
    render(
      <Entrance
        start={{ ...start, googleNonce: undefined } as never}
        onScan={() => {}}
        signInFirst={false}
        onStale={() => {}}
      />,
    );
    google.ready();
    expect(google.shown).not.toHaveBeenCalled();
    document.body.innerHTML = '';
    const { card, onScan } = open();
    expect(card.querySelector('.qr')).toBeNull();
    fireEvent.click(within(card).getByRole('button', { name: /Escanear el código/ }));
    expect(onScan).toHaveBeenCalledOnce();
  });

  it('01-E20: con la huella, demasiados intentos apagan Google y la huella, y dice cuánto falta', async () => {
    googleFrame();
    fakeServer({
      '/api/sign-in/passkey/options': {
        status: 429,
        body: { error: 'too-many-attempts', retryAfterSeconds: 45 },
      },
    });
    const { card } = open();
    fireEvent.click(within(card).getByRole('button', { name: /Entrar con la huella/ }));
    expect(await screen.findByText('Demasiados intentos seguidos')).toBeTruthy();
    expect(screen.getByText('0:45')).toBeTruthy();
    expect(
      within(card)
        .getByRole('button', { name: /Entrar con la huella/ })
        .hasAttribute('disabled'),
    ).toBe(true);
  });

  it('01-E16b: si leyó el código sin sesión, le dice que entre primero', () => {
    googleFrame();
    open({ signInFirst: true });
    expect(screen.getByText('Entrá en este celular para que entre la computadora')).toBeTruthy();
  });

  it('R2.11: puesta la huella, la espera dice cómo entra mientras el servidor no contesta', async () => {
    vi.useFakeTimers();
    googleFrame();
    fakePasskeys();
    phone();
    const server = fakeServer({
      '/api/sign-in/passkey/options': { body: {} },
      '/api/sign-in/passkey': 'waiting',
    });
    const { card } = open();
    fireEvent.click(within(card).getByRole('button', { name: /Entrar con la huella/ }));
    // La llave de la sesión se crea con la criptografía del navegador, que no sigue al reloj falso.
    await vi.waitFor(() => expect(server.bodies('/api/sign-in/passkey')).toHaveLength(1));
    await later(300);
    expect(screen.getAllByText('Entrando con tu huella').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Huella confirmada').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Abriendo tu sesión').length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('R2.11: con el pase de Google, la computadora tapa solo la tarjeta con la espera', async () => {
    vi.useFakeTimers();
    const google = googleFrame();
    const server = fakeServer({ '/api/sign-in/google': 'waiting' });
    const { card } = open();
    google.credential('pase');
    await vi.waitFor(() => expect(server.bodies('/api/sign-in/google')).toHaveLength(1));
    await later(300);
    expect(within(card).getByText('Conectando tu cuenta de Google')).toBeTruthy();
    expect(card.querySelector('.card-body')?.hasAttribute('inert')).toBe(true);
    vi.useRealTimers();
  });
});
