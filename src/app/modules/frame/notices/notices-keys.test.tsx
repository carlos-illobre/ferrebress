// Las teclas de los avisos del marco (00 · R5.3 a R5.5, R9.5) y de «Sin permiso» (02 · R7.7), del
// mapa de teclas (keyboard/shortcuts/keymap.ts), con la tecla a la vista en cada botón.
import { act, render, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readStored } from '../../../platform/device/storage.ts';
import { navigate } from '../../../platform/router.ts';
import { newVersion, updateRequired } from '../../../platform/server/api.ts';
import { fakeServer } from '../../../testing/fake-server.ts';
import { keyboardForEachTest } from '../../../testing/keyboard.ts';
import { open, person } from '../../../views/basic/frame/frame-test-kit.tsx';
import { Dialogs, VersionNotice } from '../../../views/basic/frame/notices/Notices.tsx';
import { keyShown } from '../../../views/basic/kit.ts';
import { Toasts } from '../../../views/basic/ui/toast/Toast.tsx';
import { crash, reportCrash } from './crash/crash.ts';
import { dismissed } from './update/update.ts';

vi.mock('html-to-image', () => ({ toJpeg: vi.fn(async () => '') }));

const alt = (letter: string) =>
  act(() => {
    dispatchEvent(
      new KeyboardEvent('keydown', { key: letter, code: `Key${letter}`, altKey: true }),
    );
  });

const all = () =>
  render(
    <div id="app">
      <VersionNotice />
      <Dialogs />
      <Toasts />
    </div>,
  );

describe('las teclas de los avisos del marco', () => {
  keyboardForEachTest();
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.unstubAllGlobals();
    act(() => {
      newVersion.set(false);
      updateRequired.set(false);
      dismissed.set(false);
      crash.set(undefined);
    });
  });

  it('app-E28: en la versión nueva, Alt N es «Ahora no» y Alt A, «Actualizar»', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...location, reload });
    all();
    act(() => newVersion.set(true));
    const notice = screen.getByRole('status', { name: 'Hay una versión nueva' });
    expect(keyShown(within(notice).getByRole('button', { name: /Ahora no/ }))).toBe('N');
    alt('A');
    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
    alt('N');
    expect(screen.queryByRole('status', { name: 'Hay una versión nueva' })).toBeNull();
  });

  it('app-E31: con la actualización obligatoria, Alt A actualiza', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...location, reload });
    all();
    act(() => updateRequired.set(true));
    const block = screen.getByRole('alertdialog', { name: 'Hay que actualizar para seguir' });
    expect(keyShown(within(block).getByRole('button', { name: /Actualizar/ }))).toBe('A');
    alt('A');
    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
  });

  it('app-E50: en «Algo salió mal», Alt V avisa y sigue, y Alt S sigue sin avisar', async () => {
    all();
    await act(() => reportCrash());
    expect(keyShown(screen.getByRole('button', { name: /Avisar y seguir/ }))).toBe('V');
    alt('V');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(readStored<{ code: string }>('crash-report')?.code).toMatch(/^F-/);
    localStorage.clear();
    await act(() => reportCrash());
    alt('S');
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(readStored('crash-report')).toBeUndefined();
  });

  it('users-E45: en «Sin permiso», Alt C copia el pedido', async () => {
    fakeServer({ '/api/permissions/users.view/holders': { body: { roles: [], grantedBy: [] } } });
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    navigate('/users');
    open({ who: { ...person, permissions: ['offline.work'] }, screens: { users: () => null } });
    const copy = await screen.findByRole('button', { name: /Copiar el pedido/ });
    expect(keyShown(copy)).toBe('C');
    alt('C');
    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
  });
});
