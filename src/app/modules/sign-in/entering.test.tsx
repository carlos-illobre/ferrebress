import 'fake-indexeddb/auto';
import { fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeServer } from '../../testing/fake-server.ts';
import { later } from '../../testing/later.ts';
import { Entrance } from './index.ts';
import { person } from './session.ts';
import { fakePasskeys, googleFrame, phone, startReply } from './sign-in-test-kit.ts';

const start = startReply().body as Parameters<typeof Entrance>[0]['start'];

function open({ signInFirst = false, onScan = vi.fn(), onStale = vi.fn() } = {}) {
  render(<Entrance start={start} onScan={onScan} signInFirst={signInFirst} onStale={onStale} />);
  return { onScan, onStale, card: screen.getByRole('region', { name: 'Entrar' }) };
}

// «Entrando» (R2.11): la espera mientras se abre la sesión, en el celular y en la computadora.
describe('la espera de entrar', () => {
  beforeEach(() => {
    localStorage.clear();
    person.set(undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
