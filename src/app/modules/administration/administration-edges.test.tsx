// Los bordes de la pantalla de Administración: sin saber quién tiene el permiso o quién cambió algo,
// sin los números del redondeo, el celular y la hora que se mueve sola.
import { fireEvent, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { stubMedia } from '../../testing/media.ts';
import { openAdministration, saveOf, seller } from './administration-test-kit.tsx';

const _ok = (value: unknown, version = 1) => ({ body: { value, version } });

describe('Administración, los bordes', () => {
  it('sin saber quién lo cambió, dice «otra persona»; en el celular, el calendario es de medio año', async () => {
    const before = window.matchMedia.bind(window);
    stubMedia((query) => query.includes('max-width') || before(query).matches);
    openAdministration({
      [saveOf('pairingDays')]: {
        status: 409,
        body: { error: 'setting-changed', value: 15, version: 1, by: '' },
      },
    });
    fireEvent.click(await screen.findByRole('tab', { name: /Días del vínculo/ }));
    expect(document.querySelectorAll('.admin-weeks i')).toHaveLength(26);
    fireEvent.click(screen.getByRole('button', { name: '7' }));
    expect(
      await screen.findByText('Lo cambió otra persona recién: ahora vale 15 días.'),
    ).toBeTruthy();
  });

  it('la hora del negocio se mueve sola, sin pedidos', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const server = openAdministration();
    fireEvent.click(await screen.findByRole('tab', { name: /Zona horaria/ }));
    const asked = server.sent.length;
    vi.advanceTimersByTime(30_000);
    expect(server.sent).toHaveLength(asked);
  });

  it('sin poder decir quién tiene el permiso, igual dice cuál falta; y sin él, escribir no guarda', async () => {
    const server = openAdministration(
      {
        '/api/permissions/settings.change/holders': { status: 500, body: { error: 'unexpected' } },
      },
      seller,
    );
    expect(
      await screen.findByText('Para cambiar algo hace falta «Cambiar los ajustes».'),
    ).toBeTruthy();
    fireEvent.click(await screen.findByRole('tab', { name: /Márgenes rápidos/ }));
    const first = screen.getByLabelText('Margen de la tecla 1') as HTMLInputElement;
    first.value = '350';
    fireEvent.focusOut(first);
    expect(server.bodies(saveOf('quickMargins'))).toEqual([]);
  });

  it('si no llegaron los números del redondeo, la confirmación cuenta sobre lo que dijo el servidor', async () => {
    openAdministration({
      '/api/administration/rounding': { status: 500, body: { error: 'unexpected' } },
      [saveOf('roundingStep')]: { status: 409, body: { error: 'confirm-prices', prices: 7 } },
    });
    fireEvent.click(await screen.findByRole('button', { name: /\$ 10\b/ }));
    expect(await screen.findByText('7 de 7 precios cambian')).toBeTruthy();
  });
});
