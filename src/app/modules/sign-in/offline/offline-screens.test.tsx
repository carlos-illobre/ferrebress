import 'fake-indexeddb/auto';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { online, sessionClosed } from '../../../platform/server/api.ts';
import { fakeServer } from '../../../testing/fake-server.ts';
import { Toasts } from '../../../ui/toast/Toast.tsx';
import { Entrance } from '../index.ts';
import { person } from '../session.ts';
import { startReply } from '../sign-in-test-kit.ts';
import { eva, fakeFinger, resetOffline } from './offline-kit.ts';
import { contacted, enableOffline, permit } from './permit.ts';
import { useOfflineSetting } from './setting.ts';

const start = startReply().body as Parameters<typeof Entrance>[0]['start'];

function openOffline() {
  fakeServer({ '/api/sign-in/codes': 'offline', '/api/realtime/sign-in-codes': 'offline' });
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
    await waitFor(() => expect(person.get()).toEqual(eva));
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

  it('offline-E02, E04: solo en el celular y si el servidor dice que puede', () => {
    expect(renderHook(() => useOfflineSetting(eva)).result.current).toBeUndefined();
    fakeFinger();
    const { offline: _, ...without } = eva;
    expect(renderHook(() => useOfflineSetting(without)).result.current).toBeUndefined();
    expect(renderHook(() => useOfflineSetting(undefined)).result.current).toBeUndefined();
  });

  it('offline-E01, R1.3: se prende con conexión y se apaga siempre; sin conexión, avisa', () => {
    fakeFinger();
    render(<Toasts />);
    const { result } = renderHook(() => useOfflineSetting(eva));
    expect(result.current).toMatchObject({ name: 'Trabajar sin conexión', on: false });
    act(() => result.current?.toggle());
    expect(permit.get()?.person).toEqual(eva);
    expect(result.current?.on).toBe(true);
    act(() => online.set(false));
    act(() => result.current?.toggle());
    expect(permit.get()).toBeUndefined();
    act(() => result.current?.toggle());
    expect(permit.get()).toBeUndefined();
    expect(screen.getByText('Para prenderla hace falta internet.')).toBeTruthy();
  });
});
