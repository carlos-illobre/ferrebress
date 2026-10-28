import { act, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newVersion } from '../../platform/api.ts';
import { media, open, person } from './frame-test-kit.tsx';
import { Dialogs, parts, registerWork, watchBackground, watchCrashes } from './index.ts';
import { crash, reportCrash } from './notices/crash.ts';
import { discardWork, halfDone } from './work.ts';

vi.mock('html-to-image', () => ({ toJpeg: vi.fn(async () => 'data:image/jpeg;base64,') }));

describe('lo que el marco cuida', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    newVersion.set(false);
    crash.set(undefined);
  });

  it('app-E03: al abrir, abre la primera opción del menú', () => {
    media();
    const { side } = open();
    const current = side.querySelector('[aria-current="page"]');
    expect(current?.textContent).toContain(parts[0]?.name);
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
