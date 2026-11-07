import 'fake-indexeddb/auto';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { online, sessionClosed } from '../../../platform/server/api.ts';
import { codesPath } from '../../../testing/codes-stream.ts';
import { fakeServer } from '../../../testing/fake-server.ts';
import { Toasts } from '../../../ui/toast/Toast.tsx';
import { Entrance } from '../index.ts';
import { passkeyLinked, person } from '../session.ts';
import { startReply } from '../sign-in-test-kit.ts';
import { eva, fakeFinger, resetOffline } from './offline-kit.ts';
import { contacted, enableOffline, offlineOption } from './option.ts';
import { useOfflineSetting } from './setting.ts';

const start = startReply().body as Parameters<typeof Entrance>[0]['start'];

function openOffline() {
  fakeServer({ '/api/sign-in/codes': 'offline', [codesPath()]: 'offline' });
  act(() => online.set(false));
  render(<Entrance start={start} onScan={vi.fn()} signInFirst={false} onStale={vi.fn()} />);
}

const finger = () => screen.getByRole('button', { name: /Ingresar con huella/ });

describe('la entrada del celular sin conexión', () => {
  beforeEach(resetOffline);
  afterEach(() => {
    vi.unstubAllGlobals();
    act(() => online.set(true));
  });

  it('offline-E06, E07: con la opción, la huella prendida, hasta cuándo, y entra con ella', async () => {
    fakeFinger();
    contacted(Date.now());
    enableOffline(eva);
    openOffline();
    expect(screen.getByText(/Sin conexión: podés entrar con la huella hasta/)).toBeTruthy();
    expect(finger().hasAttribute('disabled')).toBe(false);
    expect(screen.queryByText('Para entrar hace falta internet')).toBeNull();
    fireEvent.click(finger());
    await waitFor(() => expect(person.get()).toMatchObject({ userId: eva.userId, name: eva.name }));
  });

  it('offline-E12: sin la opción, todo apagado, como siempre', () => {
    fakeFinger();
    openOffline();
    expect(screen.getByText('Para entrar hace falta internet')).toBeTruthy();
    expect(finger().hasAttribute('disabled')).toBe(true);
  });

  it('offline-R3.2: si el servidor no la confirmó, lo dice arriba; si la cuenta está dada de baja, también', () => {
    fakeFinger();
    act(() => sessionClosed.set('offline-not-confirmed'));
    openOffline();
    expect(screen.getByText('No se pudo confirmar tu entrada sin conexión')).toBeTruthy();
    act(() => sessionClosed.set('not-authorized'));
    expect(screen.getByText(/Esta cuenta no está autorizada/)).toBeTruthy();
  });
});

describe('la opción «Trabajar sin conexión»', () => {
  beforeEach(resetOffline);
  afterEach(() => {
    vi.unstubAllGlobals();
    act(() => online.set(true));
  });

  it('offline-E02, E04, device-settings-E29, E31: solo en el celular y con el permiso', () => {
    expect(renderHook(() => useOfflineSetting(eva)).result.current).toBeUndefined();
    fakeFinger();
    const without = { ...eva, permissions: [] };
    expect(renderHook(() => useOfflineSetting(without)).result.current).toBeUndefined();
    expect(renderHook(() => useOfflineSetting(undefined)).result.current).toBeUndefined();
  });

  it('device-settings-E30, E37: con el permiso y sin su huella en el celular, apagada y dice por qué; nunca se prende', () => {
    fakeFinger();
    const { offline: _, ...beto } = { ...eva, userId: 'beto' };
    const { result } = renderHook(() => useOfflineSetting(beto));
    expect(result.current).toMatchObject({
      on: false,
      blocked: 'Para usarla, primero vinculá tu huella en este celular.',
    });
    act(() => result.current?.toggle());
    expect(offlineOption.get()).toBeUndefined();
    // Con la huella de otra persona (Ana prendió la suya): no se la puede reemplazar.
    passkeyLinked();
    enableOffline(eva);
    const other = renderHook(() => useOfflineSetting(beto)).result;
    expect(other.current?.blocked).toMatch(/huella de otra persona/);
    act(() => other.current?.toggle());
    expect(offlineOption.get()?.person.userId).toBe(eva.userId);
  });

  it('offline-E01, R1.3: se prende con conexión y se apaga siempre; sin conexión, avisa', () => {
    fakeFinger();
    render(<Toasts />);
    const { result } = renderHook(() => useOfflineSetting(eva));
    expect(result.current).toMatchObject({ name: 'Trabajar sin conexión', on: false });
    act(() => result.current?.toggle());
    expect(offlineOption.get()?.person).toEqual({
      userId: eva.userId,
      name: eva.name,
      roles: eva.roles,
      permissions: eva.permissions,
      rolesChangedBy: null,
      rolesChangedAt: null,
    });
    expect(result.current?.on).toBe(true);
    act(() => online.set(false));
    act(() => result.current?.toggle());
    expect(offlineOption.get()).toBeUndefined();
    act(() => result.current?.toggle());
    expect(offlineOption.get()).toBeUndefined();
    expect(screen.getByText('Para prenderla hace falta internet.')).toBeTruthy();
  });
});
