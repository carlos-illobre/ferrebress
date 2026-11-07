// Este dispositivo en Configuración (04 · R6.2, R6.3, R9, R10): el nombre con su cuenta, las ideas y
// el aviso de repetido; la huella del celular en la mano; vincular después de confirmar quién es; y
// sin conexión. Con el servidor de mentira; la hoja de confirmar y la huella, de mentira.
import type { MyDevicesResponse } from '@ferrebress/shared/contracts/device-settings';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate } from '../../platform/router.ts';
import { fakeServer, type Reply } from '../../testing/fake-server.ts';
import { inApp } from '../../testing/link-screens.ts';
import { stubMedia } from '../../testing/media.ts';
import { administrator } from '../../testing/person.ts';
import { open } from '../frame/frame-test-kit.tsx';
import { person } from '../sign-in/index.ts';
import { Settings } from './index.ts';

const linking = vi.hoisted(() => ({ result: 'linked' as 'linked' | 'other-account' | undefined }));
vi.mock('../sign-in/index.ts', async (original) => ({
  ...(await original<object>()),
  linkHere: async () => linking.result,
  // La hoja de confirmar quién es: confirma en cuanto se abre.
  loadConfirmSheet: async () => ({
    ConfirmSheet: ({ onConfirmed, onClose }: { onConfirmed: () => void; onClose: () => void }) => {
      setTimeout(() => {
        onConfirmed();
        onClose();
      });
      return null;
    },
  }),
}));

const ana = { userId: 'u1', name: 'Ana Gómez', email: 'ana@example.com', ...administrator };
const here = (change: Partial<MyDevicesResponse['here']>): MyDevicesResponse => ({
  here: {
    deviceLabel: 'Chrome en Android',
    isPhone: true,
    passkey: 'none',
    computers: [],
    ...change,
  },
  others: [],
  names: ['Caja'],
});
const ok = (body: unknown): Reply => ({ body });
const toast = () => document.querySelector('.toast')?.textContent;

function openMine(routes: Record<string, Reply | Reply[]>, phone = true) {
  stubMedia((query) => query.includes('max-width') && phone);
  if (phone) vi.stubGlobal('navigator', { ...navigator, userAgent: 'Android' });
  const server = fakeServer(routes);
  inApp();
  act(() => person.set(ana));
  navigate('/device-settings');
  open({ who: ana, screens: { deviceSettings: Settings } });
  return server;
}
const input = () => screen.getByRole('textbox', { name: 'Nombre de esta computadora' });
const type = (text: string) => fireEvent.input(input(), { target: { value: text } });

describe('este dispositivo en Configuración', () => {
  afterEach(() => {
    act(() => person.set(undefined));
    vi.unstubAllGlobals();
    navigate('/', { replace: true });
  });

  it('device-settings-E52 a E55: ponerle nombre, con la cuenta, las ideas, el aviso de repetido, y borrarlo', async () => {
    const named = { ...here({ isPhone: false, deviceLabel: 'Chrome en Windows' }) };
    const server = openMine(
      {
        '/api/me/devices': [
          ok(named),
          ok({ ...named, here: { ...named.here, deviceName: 'caja' } }),
          ok(named),
        ],
        '/api/me/device-name': [
          ok({ name: 'caja', repeated: true }),
          ok({ name: null, repeated: false }),
        ],
      },
      false,
    );
    fireEvent.click(await screen.findByRole('button', { name: /Ponele nombre/ }));
    type('a'.repeat(31));
    expect(screen.getByText('31/30').className).toContain('full');
    expect((screen.getByRole('button', { name: 'Listo' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    // Con Enter tampoco se guarda.
    fireEvent.submit(input().closest('form') as HTMLFormElement);
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Ponele nombre/ }));
    fireEvent.click(screen.getByRole('button', { name: /Caja 2/ }));
    expect(screen.getByText('Caja 2', { selector: '.mine-device-name' })).toBeTruthy();
    type(' caja ');
    expect(screen.getByRole('status').textContent).toContain('Otro dispositivo ya se llama así');
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    await waitFor(() => expect(toast()).toBe('Listo: ahora se llama caja'));
    await waitFor(() => expect(document.querySelector('.mine-device.shines')).toBeTruthy());
    await waitFor(() => expect(document.querySelector('.mine-device.shines')).toBeNull(), {
      timeout: 1500,
    });
    fireEvent.click(await screen.findByRole('button', { name: /Borrar/ }));
    await waitFor(() => expect(toast()).toBe('Nombre borrado: se ve el navegador'));
    expect(server.bodies('/api/me/device-name')).toEqual([{ name: 'caja' }, { name: '' }]);
  });

  it('device-settings-E42: la huella del celular en la mano se quita y sigue adentro', async () => {
    const used = { createdAt: 1_600_000_000_000, lastUsedAt: 1_699_990_000_000 };
    const computer = {
      deviceLabel: 'Chrome en Windows',
      session: {
        id: 's1',
        way: 'qr' as const,
        createdAt: 1_699_000_000_000,
        lastUsedAt: 1_699_000_000_000,
      },
    };
    const mine = here({
      deviceName: 'Celu de Ana',
      passkey: 'mine',
      since: used,
      computers: [computer],
    });
    openMine({
      '/api/me/devices': [ok(mine), ok(here({}))],
      '/api/me/passkey/remove': ok({ sessions: 0, passkey: true }),
    });
    expect(await screen.findByText(/Tu huella está acá desde/)).toBeTruthy();
    expect(screen.getByText(/^Último uso /)).toBeTruthy();
    expect(screen.getByText('Entraron con el código de este celular')).toBeTruthy();
    expect(screen.getByText(/· usada /)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar' }));
    await waitFor(() =>
      expect(toast()).toBe('Quitaste la huella de este celular: entrás con Google'),
    );
    expect(await screen.findByRole('button', { name: /Vincular este celular/ })).toBeTruthy();
  });

  it('device-settings-E43, E44: vincular pasa por confirmar quién es; con la huella de otra persona, lo dice', async () => {
    openMine({ '/api/me/devices': [ok(here({})), ok(here({ passkey: 'other' }))] });
    linking.result = 'other-account';
    fireEvent.click(await screen.findByRole('button', { name: /Vincular este celular/ }));
    await waitFor(() => expect(toast()).toBe('Este celular ya tiene la huella de otra persona'));
    expect(await screen.findByText('Este celular tiene la huella de otra persona.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Vincular/ })).toBeNull();
  });

  it('device-settings-E43: si no se vincula, no dice nada y sigue «Vincular»', async () => {
    const server = openMine({ '/api/me/devices': ok(here({})) });
    linking.result = undefined;
    fireEvent.click(await screen.findByRole('button', { name: /Vincular este celular/ }));
    await waitFor(() =>
      expect(server.sent.filter((s) => s.path === '/api/me/devices')).toHaveLength(2),
    );
    expect(toast()).not.toBe('Listo: desde ahora entrás con tu huella acá');
  });

  it('device-settings-E43: vinculada, lo dice', async () => {
    const server = openMine({ '/api/me/devices': ok(here({})) });
    linking.result = 'linked';
    fireEvent.click(await screen.findByRole('button', { name: /Vincular este celular/ }));
    await waitFor(() => expect(toast()).toBe('Listo: desde ahora entrás con tu huella acá'));
    // Y vuelve a pedir lo suyo.
    await waitFor(() =>
      expect(server.sent.filter((s) => s.path === '/api/me/devices')).toHaveLength(2),
    );
  });

  it('device-settings-E57: sin conexión, lo último que se vio, gris, y «Reintentar»; un rechazo se dice', async () => {
    openMine({
      '/api/me/devices': [
        ok(here({ deviceName: 'Celu' })),
        'offline',
        ok(here({ deviceName: 'Celu' })),
      ],
      '/api/me/device-name': [{ status: 500, body: { error: 'unexpected' } }],
    });
    fireEvent.click(await screen.findByRole('button', { name: /Cambiar el nombre/ }));
    // Vacío es borrarlo.
    fireEvent.input(screen.getByRole('textbox', { name: 'Nombre de este celular' }), {
      target: { value: '  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    await waitFor(() => expect(toast()).toBe('No se pudo: probá de nuevo'));
    expect(await screen.findByText('Sin conexión: lo tuyo está en el servidor')).toBeTruthy();
    expect(document.querySelector('.mine-server.is-offline')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    await waitFor(() =>
      expect(screen.queryByText('Sin conexión: lo tuyo está en el servidor')).toBeNull(),
    );
  });

  it('sin conexión al abrir, o si falla, lo dice con «Reintentar»', async () => {
    openMine({
      '/api/me/devices': ['offline', { status: 500, body: { error: 'unexpected' } }, ok(here({}))],
    });
    expect(await screen.findByText('Sin conexión: lo tuyo está en el servidor')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByText('No se pudo traer lo tuyo')).toBeTruthy();
    fireEvent.click(
      within(document.querySelector('.mine-load') as HTMLElement).getByRole('button'),
    );
    expect(
      await screen.findByText('No tenés nada abierto en otro dispositivo. Solo este celular.'),
    ).toBeTruthy();
  });
});
