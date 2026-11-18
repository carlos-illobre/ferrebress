// Ver qué cambia con el teclado y sin conexión (08 · pantalla 3): Alt A aplica, Alt D descarta, Alt C
// cancela mientras se aplica y Alt R reintenta.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { online } from '../../../platform/server/api.ts';
import { startKeyboard } from '../../../testing/keyboard.ts';
import { listPath, openReview, pending } from '../../../views/basic/price-lists/review/kit.tsx';

const applyLabel = /^Aplicar: 4 nuevos, 31 costos, 2 bajas/;

describe('ver qué cambia con el teclado y sin conexión', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => {
    stop();
    vi.restoreAllMocks();
  });

  it('Alt A aplica y Alt D descarta', async () => {
    const { server } = openReview({
      [`${listPath}/apply`]: { status: 500, body: { error: 'unexpected' } },
      [`${listPath}/discard`]: { status: 500, body: { error: 'unexpected' } },
    });
    await screen.findByRole('button', { name: applyLabel });
    fireEvent.keyDown(window, { key: 'A', code: 'KeyA', altKey: true });
    await waitFor(() => expect(server.bodies(`${listPath}/apply`)).toHaveLength(1));
    fireEvent.keyDown(window, { key: 'D', code: 'KeyD', altKey: true });
    await waitFor(() => expect(server.bodies(`${listPath}/discard`)).toHaveLength(1));
  });

  it('Alt C cancela mientras se aplica', async () => {
    const { server } = openReview({
      [listPath]: { body: pending({ status: 'applying' }) },
      [`${listPath}/cancel`]: { status: 202, body: { cancelling: true } },
    });
    await screen.findByRole('button', { name: /^Cancelar/ });
    fireEvent.keyDown(window, { key: 'C', code: 'KeyC', altKey: true });
    await waitFor(() => expect(server.bodies(`${listPath}/cancel`)).toHaveLength(1));
  });

  it('sin conexión, gris lo último que se vio, sin aplicar, y Alt R reintenta', async () => {
    const { server } = openReview();
    await screen.findByRole('button', { name: applyLabel });
    online.set(false);
    expect(await screen.findByText(/Sin conexión: es lo último que se vio/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: applyLabel })).toBeNull();
    const asked = () => server.sent.filter((s) => s.path === listPath).length;
    const before = asked();
    online.set(true);
    fireEvent.keyDown(window, { key: 'R', code: 'KeyR', altKey: true });
    await waitFor(() => expect(asked()).toBeGreaterThan(before));
  });
});
