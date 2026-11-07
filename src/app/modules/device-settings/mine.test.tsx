// Lo mío en Configuración (04 · R1.8, R6 a R10): este dispositivo con su nombre y su huella, los otros
// con su sesión y su huella, «Cerrar», «Cerrar todas», «Quitar», «Se me perdió» con el recibo, y sin
// conexión. Con el servidor de mentira.
import type { MyDevicesResponse } from '@ferrebress/shared/contracts/device-settings';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate } from '../../platform/router.ts';
import { online } from '../../platform/server/api.ts';
import { fakeServer, type Reply } from '../../testing/fake-server.ts';
import { inApp } from '../../testing/link-screens.ts';
import { stubMedia } from '../../testing/media.ts';
import { administrator } from '../../testing/person.ts';
import { open } from '../frame/frame-test-kit.tsx';
import { person } from '../sign-in/index.ts';
import { Settings } from './index.ts';

const ana = { userId: 'u1', name: 'Ana Gómez', email: 'ana@example.com', ...administrator };
// La hora del servidor de mentira (su cabecera).
const now = 1_700_000_000_000;
const session = (id: string, way: 'google' | 'qr' = 'google') => ({
  id,
  way,
  createdAt: now - 3_600_000,
  lastUsedAt: now - 60_000,
});
const rubens = {
  key: 'k-ruben',
  deviceLabel: 'Chrome en Android',
  deviceName: 'Celu de Rubén',
  isPhone: true,
  session: session('s-ruben'),
  passkey: { createdAt: now - 86_400_000, lastUsedAt: null },
  computers: [
    { deviceLabel: 'Chrome en Windows', deviceName: 'Caja 2', session: session('s-caja', 'qr') },
  ],
};
const { deviceName: _, ...unnamed } = rubens;
const old = { ...unnamed, key: 'k-old', session: null, computers: [] };
const fromComputer: MyDevicesResponse = {
  here: { deviceLabel: 'Chrome en Windows', isPhone: false, passkey: 'none', computers: [] },
  others: [
    rubens,
    { ...old, passkey: { createdAt: now, lastUsedAt: now } },
    {
      ...old,
      key: 'k-mac',
      deviceLabel: 'Chrome en macOS',
      isPhone: false,
      session: session('s-mac'),
      passkey: null,
    },
  ],
  names: ['Celu de Rubén', 'Caja 2'],
};
const ok = (body: unknown): Reply => ({ body });

function openMine(routes: Record<string, Reply | Reply[]>, phone = false) {
  stubMedia((query) => query.includes('max-width') && phone);
  if (phone) vi.stubGlobal('navigator', { ...navigator, userAgent: 'Android' });
  const server = fakeServer(routes);
  // El diálogo deja inerte a la aplicación de atrás.
  inApp();
  act(() => person.set(ana));
  navigate('/device-settings');
  open({ who: ana, screens: { deviceSettings: Settings } });
  return server;
}
const family = (name: string) =>
  screen.getByRole('heading', { name }).closest('article') as HTMLElement;
const toast = () => document.querySelector('.toast')?.textContent;

describe('lo mío en Configuración', () => {
  afterEach(() => {
    act(() => person.set(undefined));
    vi.unstubAllGlobals();
    navigate('/', { replace: true });
  });

  it('device-settings-E10, E40, E45, E47: este dispositivo y los otros, con su sesión, su huella y lo que hizo entrar', async () => {
    openMine({ '/api/me/devices': ok(fromComputer) });
    expect(await screen.findByText('Celu de Rubén')).toBeTruthy();
    expect(screen.getByText('Esta computadora')).toBeTruthy();
    expect(screen.getByText('Sin nombre', { selector: '.mine-device-name' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Vincular/ })).toBeNull();
    const ruben = within(family('Celu de Rubén'));
    expect(ruben.getByText('Usada ahora')).toBeTruthy();
    expect(ruben.getByText(/Con Google · entró/)).toBeTruthy();
    expect(ruben.getByText('Todavía no se usó')).toBeTruthy();
    expect(ruben.getByText('Caja 2')).toBeTruthy();
    expect(within(family('Chrome en Android')).getByText('Sin nombre')).toBeTruthy();
    expect(document.querySelector('.mine-counts')?.textContent).toContain('Sesiones abiertas3');
  });

  it('device-settings-E48: «Cerrar» una sin confirmación y «Cerrar todas» después de confirmar', async () => {
    const server = openMine({
      '/api/me/devices': ok(fromComputer),
      '/api/me/sessions/s-caja/close': ok({ closed: 1 }),
      '/api/me/sessions/s-ruben/close': ok({ closed: 1 }),
      '/api/me/sessions/close': ok({ closed: 2 }),
    });
    await screen.findByText('Caja 2');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar la sesión de Caja 2' }));
    await waitFor(() => expect(toast()).toBe('Sesión cerrada · Caja 2'));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar la sesión de Celu de Rubén' }));
    await waitFor(() => expect(server.bodies('/api/me/sessions/s-ruben/close')).toHaveLength(1));
    fireEvent.click(screen.getByRole('button', { name: /Cerrar todas/ }));
    const dialog = screen.getByRole('alertdialog', {
      name: '¿Cerrar tus 3 sesiones en otros dispositivos?',
    });
    expect(dialog.textContent).toContain('Esta computadora sigue adentro.');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: /Cerrar todas/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cerrar las 3' }));
    await waitFor(() => expect(toast()).toBe('Se cerraron las 2 sesiones'));
    expect(server.sent.filter((s) => s.path === '/api/me/devices').length).toBe(4);
  });

  it('device-settings-R1.8, R10.1: esta computadora, colgada del celular que la hizo entrar, sin ×; sin conexión, gris al momento', async () => {
    const thisOne = {
      deviceLabel: 'Chrome en Windows',
      session: session('s-me', 'qr'),
      here: true as const,
    };
    openMine({
      '/api/me/devices': ok({ ...fromComputer, others: [{ ...rubens, computers: [thisOne] }] }),
    });
    const ruben = within(
      await screen
        .findByRole('heading', { name: 'Celu de Rubén' })
        .then(() => family('Celu de Rubén')),
    );
    expect(ruben.getByText('Esta computadora')).toBeTruthy();
    expect(
      ruben.queryByRole('button', { name: /Cerrar la sesión de Chrome en Windows/ }),
    ).toBeNull();
    expect(document.querySelector('.mine-counts')?.textContent).toContain('Sesiones abiertas1');
    act(() => online.set(false));
    expect(screen.getByText('Sin conexión: lo tuyo está en el servidor')).toBeTruthy();
    act(() => online.set(true));
    expect(screen.queryByText('Sin conexión: lo tuyo está en el servidor')).toBeNull();
  });

  it('device-settings-E49, E41: «Se me perdió» y «Quitar» dejan el recibo con lo cortado; «Listo» lo saca', async () => {
    const server = openMine({
      '/api/me/devices': ok(fromComputer),
      '/api/me/devices/k-ruben/cut': ok({ sessions: 2, passkey: true }),
      '/api/me/devices/k-old/cut': ok({ sessions: 0, passkey: true }),
    });
    await screen.findByText('Caja 2');
    const lost = within(family('Celu de Rubén')).getByRole('button', { name: /Se me perdió/ });
    // En la computadora, apoyar el mouse no corta: corta el clic.
    fireEvent.pointerDown(lost);
    fireEvent.click(lost);
    const receipt = await screen.findByText('Cortaste Celu de Rubén');
    const box = receipt.closest('.mine-receipt') as HTMLElement;
    expect(box.textContent).toContain('Su sesión');
    expect(box.textContent).toContain('La sesión de Caja 2, que entró con su código');
    expect(box.textContent).toContain('Su huella');
    fireEvent.click(screen.getByRole('button', { name: 'Quitar la huella de Chrome en Android' }));
    expect(await screen.findByText('Quitaste la huella de Chrome en Android')).toBeTruthy();
    expect(server.bodies('/api/me/devices/k-old/cut')).toEqual([{ how: 'remove' }]);
    fireEvent.click(within(box).getByRole('button', { name: 'Listo' }));
    expect(screen.queryByText('Cortaste Celu de Rubén')).toBeNull();
  });

  it('device-settings-R8.1, R1.8: en el celular se corta al soltar el dedo sin moverlo; un desplazamiento no corta', async () => {
    const away = { ...rubens, session: { ...rubens.session, lastUsedAt: now - 7_200_000 } };
    const fromPhone = {
      ...fromComputer,
      here: { ...fromComputer.here, isPhone: true },
      others: [away],
    };
    const server = openMine(
      {
        '/api/me/devices': ok(fromPhone),
        '/api/me/devices/k-ruben/cut': [ok({ sessions: 0, passkey: false }), 'offline'],
      },
      true,
    );
    const lost = await screen.findByRole('button', { name: /Se me perdió/ });
    expect(screen.getByText('Sesión abierta · hace 2 horas')).toBeTruthy();
    fireEvent.click(lost);
    fireEvent.pointerDown(lost, { clientX: 10, clientY: 10 });
    expect(lost.className).toContain('pressing');
    fireEvent.pointerMove(lost, { clientX: 10, clientY: 60 });
    expect(lost.className).not.toContain('pressing');
    fireEvent.pointerUp(lost, { clientX: 10, clientY: 60 });
    fireEvent.pointerDown(lost, { clientX: 10, clientY: 10 });
    fireEvent.pointerCancel(lost);
    expect(server.bodies('/api/me/devices/k-ruben/cut')).toEqual([]);
    fireEvent.pointerDown(lost, { clientX: 10, clientY: 10 });
    fireEvent.pointerMove(lost, { clientX: 12, clientY: 12 });
    fireEvent.pointerUp(lost, { clientX: 12, clientY: 12 });
    // Ya no tenía nada: el recibo lo dice.
    expect(await screen.findByText('No tenía nada abierto')).toBeTruthy();
    expect(toast()).toContain('no había nada que cortar');
    // Sin conexión al cortar: queda gris.
    fireEvent.pointerDown(lost, { clientX: 10, clientY: 10 });
    fireEvent.pointerUp(lost, { clientX: 10, clientY: 10 });
    expect(await screen.findByText('Sin conexión: lo tuyo está en el servidor')).toBeTruthy();
  });
});
