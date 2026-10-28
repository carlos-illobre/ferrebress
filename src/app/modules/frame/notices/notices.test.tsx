import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readStored } from '../../../platform/device/storage.ts';
import { newVersion, updateRequired } from '../../../platform/server/api.ts';
import { waitBar } from '../../../platform/waiting.ts';
import { later } from '../../../testing/later.ts';
import { Toasts } from '../../../ui/toast/Toast.tsx';
import { crash, forgetReport, reportCrash, watchCrashes } from './crash/crash.ts';
import { Dialogs, VersionNotice, WaitNotice } from './Notices.tsx';
import { announceUpdate, dismissed, updateOnOpen, watchBackground } from './update/update.ts';

vi.mock('html-to-image', () => ({
  // Como la de verdad, pregunta qué nodos van en la captura.
  toJpeg: vi.fn(async (_node: Node, options: { filter: (node: Node) => boolean }) => {
    const hidden = document.createElement('div');
    hidden.dataset.private = '';
    return options.filter(hidden) || !options.filter(document.createTextNode('x'))
      ? ''
      : 'data:image/jpeg;base64,captura';
  }),
}));

function reload() {
  const spy = vi.fn();
  vi.stubGlobal('location', { ...location, reload: spy });
  return spy;
}

const all = () =>
  render(
    <div id="app">
      <WaitNotice />
      <VersionNotice />
      <Dialogs />
      <Toasts />
    </div>,
  );

describe('los avisos del marco', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    act(() => {
      newVersion.set(false);
      dismissed.set(false);
      updateRequired.set(false);
      crash.set(undefined);
      waitBar.set(undefined);
    });
  });

  it('app-E42: la espera dice qué se hace y, al terminar, «Listo» un instante', async () => {
    vi.useFakeTimers();
    all();
    act(() => waitBar.set('Guardando los cambios'));
    expect(screen.getByRole('status').textContent).toContain('Guardando los cambios');
    act(() => waitBar.set(undefined));
    expect(screen.getByRole('status').textContent).toBe('Listo');
    await later(900);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('app-E56: la espera de entrar, que ya corría al aparecer el marco, no dice «Listo»', () => {
    act(() => waitBar.set('Entrando'));
    all();
    expect(screen.queryByRole('status')).toBeNull();
    act(() => waitBar.set(undefined));
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('app-E28, E29: en uso avisa la versión nueva; «Ahora no» la cierra hasta la próxima vez', () => {
    all();
    act(() => newVersion.set(true));
    const notice = screen.getByRole('status', { name: 'Hay una versión nueva' });
    fireEvent.click(within(notice).getByRole('button', { name: /Ahora no/ }));
    expect(screen.queryByRole('status', { name: 'Hay una versión nueva' })).toBeNull();
    expect(
      screen.getByText(
        'No vuelve a aparecer: se actualiza sola la próxima vez que abras la aplicación.',
      ),
    ).toBeTruthy();
  });

  it('app-E30: «Actualizar» vuelve a cargar y, al volver, dice que se actualizó', async () => {
    const reloaded = reload();
    all();
    act(() => newVersion.set(true));
    fireEvent.click(screen.getByRole('button', { name: /^Actualizar/ }));
    await waitFor(() => expect(reloaded).toHaveBeenCalledOnce());
    act(() => announceUpdate());
    expect(screen.getByText('Versión nueva. Seguís donde estabas.')).toBeTruthy();
    act(() => announceUpdate());
  });

  it('app-E27: recién abierta se actualiza sola, una sola vez por versión del servidor', () => {
    const reloaded = reload();
    expect(updateOnOpen('v2')).toBe(false);
    newVersion.set(true);
    expect(updateOnOpen('v2')).toBe(true);
    expect(updateOnOpen('v2')).toBe(false);
    expect(reloaded).toHaveBeenCalledOnce();
  });

  it('app-E30b: en segundo plano, con una versión nueva esperando, se actualiza sola', () => {
    const reloaded = reload();
    let visibility = 'hidden';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
      () => visibility as DocumentVisibilityState,
    );
    const stop = watchBackground();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(reloaded).not.toHaveBeenCalled();
    newVersion.set(true);
    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(reloaded).toHaveBeenCalledOnce();
    stop();
    vi.restoreAllMocks();
  });

  it('sin sessionStorage, actualiza igual y no recarga sin fin', () => {
    const reloaded = reload();
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    });
    newVersion.set(true);
    expect(updateOnOpen('v2')).toBe(false);
    announceUpdate();
    reload();
    expect(reloaded).not.toHaveBeenCalled();
  });

  it('app-E31: si el servidor ya no la entiende, se bloquea; tocar afuera no lo cierra, se sacude', async () => {
    const reloaded = reload();
    all();
    act(() => updateRequired.set(true));
    const block = screen.getByRole('alertdialog', { name: 'Hay que actualizar para seguir' });
    expect((document.getElementById('app') as HTMLElement & { inert: boolean }).inert).toBe(true);
    fireEvent.click(document.querySelector('.veil') as Element);
    expect(block.classList.contains('shake')).toBe(true);
    fireEvent.click(within(block).getByRole('button', { name: /Actualizar/ }));
    await waitFor(() => expect(reloaded).toHaveBeenCalledOnce());
  });
});

describe('«Algo salió mal»', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => act(() => crash.set(undefined)));

  it('app-E49: un error que nadie atrapó lo muestra, con los últimos pasos, la captura y el código', async () => {
    const stop = watchCrashes();
    all();
    document.body.insertAdjacentHTML(
      'beforeend',
      '<nav><button aria-current="page"><span class="part-name">Vender</span></button></nav><button id="guardar">Guardar<kbd>G</kbd></button><input aria-label="Buscar" /><div data-private><button id="secreto">Ana</button></div>',
    );
    fireEvent.click(document.getElementById('guardar') as Element);
    screen.getByLabelText('Buscar').dispatchEvent(new Event('change', { bubbles: true }));
    document.body.insertAdjacentHTML('beforeend', '<input id="sin-nombre" />');
    document.getElementById('sin-nombre')?.dispatchEvent(new Event('change', { bubbles: true }));
    fireEvent.click(document.getElementById('secreto') as Element);
    act(() => {
      dispatchEvent(new Event('error'));
    });
    const dialog = await screen.findByRole('alertdialog', { name: 'Algo salió mal' });
    expect(within(dialog).getByText(/Vender · Escribió en «Buscar»/)).toBeTruthy();
    expect(within(dialog).getByText('Vender · Tocó «Guardar»')).toBeTruthy();
    expect(dialog.textContent).not.toContain('Ana');
    expect(within(dialog).getByText(/^Código F-\d{4} · /)).toBeTruthy();
    await waitFor(() =>
      expect(within(dialog).getByRole('img', { name: 'La pantalla cuando pasó' })).toBeTruthy(),
    );
    stop();
  });

  it('anota dónde se tocó: en la entrada o en la aplicación, con el nombre que dice el botón', async () => {
    document.body.innerHTML = '';
    const stop = watchCrashes();
    all();
    document.body.insertAdjacentHTML(
      'beforeend',
      '<main class="sign-in"><button aria-label="Cerrar">×</button></main>',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    document.querySelector('.sign-in')?.remove();
    document.body.insertAdjacentHTML('beforeend', '<button>Otra</button>');
    fireEvent.click(screen.getByRole('button', { name: 'Otra' }));
    await act(() => reportCrash());
    const dialog = screen.getByRole('alertdialog');
    expect(within(dialog).getByText('La aplicación · Tocó «Otra»')).toBeTruthy();
    expect(within(dialog).getByText('La entrada · Tocó «Cerrar»')).toBeTruthy();
    stop();
  });

  it('app-E50: «Avisar y seguir» guarda el aviso y vuelve; salir lo borra', async () => {
    all();
    await act(() => reportCrash());
    await act(() => reportCrash());
    fireEvent.click(screen.getByRole('button', { name: /Avisar y seguir/ }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(readStored<{ code: string }>('crash-report')?.code).toMatch(/^F-/);
    expect(
      screen.getByText('Aviso guardado. Se manda solo cuando esté Mejoras y errores.'),
    ).toBeTruthy();
    forgetReport();
    expect(readStored('crash-report')).toBeUndefined();
  });

  it('en la computadora el cursor arranca en «Avisar y seguir»; en el celular, en ningún lado', async () => {
    all();
    await act(() => reportCrash());
    expect(document.activeElement?.textContent).toContain('Avisar y seguir');
    act(() => crash.set(undefined));
    vi.stubGlobal('navigator', {
      ...navigator,
      userAgent: 'Android',
      userAgentData: { mobile: true },
    });
    await act(() => reportCrash());
    expect(document.activeElement).toBe(document.body);
    vi.unstubAllGlobals();
  });

  it('«Seguir sin avisar» cierra sin guardar; sin captura muestra solo los pasos', async () => {
    const { toJpeg } = await import('html-to-image');
    vi.mocked(toJpeg).mockRejectedValueOnce(new Error('sin captura'));
    all();
    await act(() => reportCrash());
    expect(screen.queryByRole('img')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Seguir sin avisar/ }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(readStored('crash-report')).toBeUndefined();
    act(() => {
      dispatchEvent(new Event('unhandledrejection'));
    });
  });
});
