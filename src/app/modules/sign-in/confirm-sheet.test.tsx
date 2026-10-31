// Volver a confirmar quién es sin salir (02 · R3.8): con Google, en su marco, o con la huella en un
// celular que la tiene. Al confirmar, se cierra y repite lo que se estaba haciendo.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeServer } from '../../testing/fake-server.ts';
import { ConfirmSheet } from './screens/Sheets/ConfirmSheet.tsx';
import { passkeyLinked } from './session.ts';
import { fakePasskeys, googleFrame, phone, startReply } from './sign-in-test-kit.ts';

const open = () => {
  const onConfirmed = vi.fn();
  const onClose = vi.fn();
  render(
    <div id="app">
      <ConfirmSheet onConfirmed={onConfirmed} onClose={onClose} />
    </div>,
  );
  return { onConfirmed, onClose };
};

describe('confirmar quién es (users-R3.8)', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('con Google: pide un nonce, dibuja el botón y, con el pase, confirma y sigue', async () => {
    const frame = googleFrame();
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(280);
    const server = fakeServer({ '/api/start': startReply(), '/api/session/confirm/google': {} });
    const { onConfirmed, onClose } = open();
    frame.ready();
    frame.drawn();
    await waitFor(() =>
      expect(frame.shown).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'show', nonce: 'nonce', width: 280 }),
        location.origin,
      ),
    );
    // En la computadora no se ofrece la huella.
    expect(screen.queryByRole('button', { name: /Con mi huella/ })).toBeNull();
    frame.credential('pase');
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledOnce());
    expect(onClose).toHaveBeenCalledOnce();
    expect(server.bodies('/api/session/confirm/google')).toEqual([{ credential: 'pase' }]);
  });

  it('un pase de otra cuenta no confirma: lo dice y sigue abierta', async () => {
    const frame = googleFrame();
    fakeServer({
      '/api/start': startReply(),
      '/api/session/confirm/google': { status: 403, body: { error: 'not-authorized' } },
    });
    const { onConfirmed, onClose } = open();
    frame.ready();
    frame.credential('otra');
    expect((await screen.findByRole('alert')).textContent).toContain('No se pudo confirmar');
    expect(onConfirmed).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/ }));
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it('sin nonce (demasiados pedidos), el botón no se dibuja', async () => {
    const frame = googleFrame();
    const server = fakeServer({
      '/api/start': { status: 429, body: { error: 'too-many-requests' } },
    });
    open();
    frame.ready();
    await waitFor(() => expect(server.sent).toHaveLength(1));
    await act(async () => {});
    expect(frame.shown).not.toHaveBeenCalled();
  });

  it('en un celular con huella, la huella confirma; cancelarla, no', async () => {
    phone();
    passkeyLinked();
    googleFrame();
    const credentials = fakePasskeys();
    fakeServer({
      '/api/start': startReply(),
      '/api/session/confirm/passkey/options': { body: { challenge: 'c' } },
      '/api/session/confirm/passkey': {},
    });
    const { onConfirmed } = open();
    fireEvent.click(screen.getByRole('button', { name: /Con mi huella/ }));
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledOnce());
    expect(credentials.get).toHaveBeenCalledOnce();
  });

  it('sin desafío del servidor o con la huella cancelada, no confirma', async () => {
    phone();
    passkeyLinked();
    googleFrame();
    fakePasskeys({ cancel: true });
    fakeServer({
      '/api/start': startReply(),
      '/api/session/confirm/passkey/options': [
        { status: 429, body: { error: 'too-many-requests' } },
        { body: { challenge: 'c' } },
      ],
    });
    const { onConfirmed } = open();
    const passkey = screen.getByRole('button', { name: /Con mi huella/ });
    fireEvent.click(passkey);
    await screen.findByRole('alert');
    fireEvent.click(passkey);
    await act(async () => {});
    expect(onConfirmed).not.toHaveBeenCalled();
  });
});
