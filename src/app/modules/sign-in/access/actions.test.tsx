// La lógica común de cerrar y cortar, para lo mío (04 · R6 a R8): las rutas de la sesión, lo que se
// dice y que primero se pone al día la pantalla.
import { render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeServer } from '../../../testing/fake-server.ts';
import { Toasts } from '../../../ui/toast/Toast.tsx';
import { closeAll, closeSession, cutPhone, removeHere } from './actions.ts';
import { accessApi } from './api.ts';

const toast = () => document.querySelector('.toast')?.textContent;

describe('cerrar y cortar lo mío', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('device-settings-E48, E49, E42: por las rutas de lo mío, poniendo al día antes de decirlo', async () => {
    render(<Toasts />);
    const server = fakeServer({
      '/api/me/sessions/s1/close': { body: { closed: 1 } },
      '/api/me/sessions/close': { body: { closed: 2 } },
      '/api/me/devices/k1/cut': [
        { body: { sessions: 1, passkey: true } },
        { body: { sessions: 0, passkey: false } },
      ],
      '/api/me/passkey/remove': [
        { body: { sessions: 0, passkey: true } },
        { body: { sessions: 0, passkey: false } },
        { status: 500, body: { error: 'unexpected' } },
      ],
    });
    const seen: string[] = [];
    const then = {
      refuse: (result: { error: string }) => void seen.push(`no: ${result.error}`),
      update: () => void seen.push(`antes: ${toast() ?? ''}`),
    };
    expect(await closeSession('me', { id: 's1', device: 'Caja' }, then)).toEqual({ closed: 1 });
    expect(toast()).toBe('Sesión cerrada · Caja');
    await closeAll('me', then);
    expect(toast()).toBe('Se cerraron las 2 sesiones');
    // Como perdido, sin tostada: Configuración lo dice en el recibo.
    expect(await cutPhone('me', { key: 'k1', how: 'lost' }, then)).toEqual({
      sessions: 1,
      passkey: true,
    });
    expect(toast()).toBe('Se cerraron las 2 sesiones');
    await cutPhone('me', { key: 'k1', how: 'lost' }, then);
    expect(toast()).toContain('no había nada que cortar');
    await removeHere(then);
    expect(screen.getByText('Quitaste la huella de este celular: entrás con Google')).toBeTruthy();
    await removeHere(then);
    expect(toast()).toContain('no había nada que cortar');
    expect(await removeHere(then)).toBeUndefined();
    expect(seen.at(0)).toBe('antes: ');
    expect(seen.at(-1)).toBe('no: unexpected');
    expect(server.bodies('/api/me/devices/k1/cut')).toEqual([{ how: 'lost' }, { how: 'lost' }]);
    // Lo mío y el nombre, por sus rutas.
    await accessApi.mine();
    await accessApi.rename('Caja');
    expect(server.bodies('/api/me/device-name')).toEqual([{ name: 'Caja' }]);
    expect(server.sent.some((sent) => sent.path === '/api/me/devices')).toBe(true);
  });
});
