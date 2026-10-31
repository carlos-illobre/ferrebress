import { act, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newVersion } from '../../platform/server/api.ts';
import { media, open, person, withPath } from './frame-test-kit.tsx';
import { Dialogs, registerWork, watchBackground, watchCrashes } from './index.ts';
import { moreOptions, type Option } from './menu.ts';
import { crash, reportCrash } from './notices/crash/crash.ts';
import { discardWork, halfDone } from './work.ts';

vi.mock('html-to-image', () => ({ toJpeg: vi.fn(async () => 'data:image/jpeg;base64,') }));

describe('lo que el marco cuida', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    newVersion.set(false);
    crash.set(undefined);
  });

  it('app-E03: al abrir, abre la primera opción del menú que existe, con su pantalla', () => {
    media();
    const { side } = open({ screens: { users: () => <p>La pantalla de Usuarios</p> } });
    expect(side.querySelector('[aria-current="page"]')?.textContent).toContain('Más');
    expect(screen.getByRole('main').textContent).toBe('La pantalla de Usuarios');
  });

  it('app-E01: en pruebas, sin ninguna opción que exista, queda abierta la primera parte', () => {
    withPath(moreOptions.find((option) => option.id === 'users') as Option, undefined, () => {
      const { side } = open();
      expect(
        within(side)
          .getByRole('button', { name: /Vender/ })
          .getAttribute('aria-current'),
      ).toBe('page');
    });
  });

  it('app-E30c: con algo a medio hacer, la versión nueva no se aplica sola en segundo plano', () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...location, reload });
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    let pending = true;
    const discard = vi.fn();
    const stopWork = registerWork({ pending: () => pending, discard });
    const stop = watchBackground();
    newVersion.set(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(reload).not.toHaveBeenCalled();
    expect(halfDone()).toBe(true);
    pending = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(reload).toHaveBeenCalledOnce();
    discardWork();
    expect(discard).toHaveBeenCalledOnce();
    stopWork();
    expect(halfDone()).toBe(false);
    stop();
  });

  it('app-E54: «Algo salió mal» no guarda el nombre de la persona entre los pasos', async () => {
    media();
    open();
    const stop = watchCrashes();
    for (const button of screen.getAllByRole('button', { name: new RegExp(person.name) }))
      fireEvent.click(button);
    fireEvent.click(screen.getAllByRole('button', { name: /Más/ })[0] as HTMLElement);
    render(<Dialogs />);
    await act(() => reportCrash());
    const dialog = screen.getByRole('alertdialog');
    expect(dialog.textContent).not.toContain(person.name);
    expect(within(dialog).getByText(/Tocó «Más»/)).toBeTruthy();
    stop();
  });
});
