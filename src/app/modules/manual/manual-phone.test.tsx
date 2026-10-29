import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loaded, media, serveManual, show } from './manual-test-kit.tsx';

const sheet = () => screen.getByRole('main', { hidden: true }) as HTMLElement;
const search = () => screen.getByRole('searchbox', { name: 'Buscar en el manual' });

describe('el manual en el celular', () => {
  beforeEach(() => {
    media({ narrow: true });
    Object.defineProperty(navigator, 'userAgentData', {
      configurable: true,
      get: () => ({ mobile: true }),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'userAgentData');
  });

  it('R2.12: en el celular el cursor no arranca en el buscador; en Stock no hay nada para el celular', async () => {
    serveManual();
    show({ device: 'phone' });
    await loaded();
    expect(document.activeElement).not.toBe(search());
    expect(screen.queryByText('Stock')).toBeNull();
  });

  it('las tareas a pantalla entera; tocar una abre la hoja, que atrás o la × cierran', async () => {
    serveManual();
    const back = show({ device: 'phone' });
    await loaded();
    expect(document.querySelector('.manual-body')?.classList.contains('in-guide')).toBe(false);
    fireEvent.click(
      screen.getAllByRole('button', { name: /Entrar sin internet/ })[0] as HTMLElement,
    );
    await waitFor(() => expect(within(sheet()).getByText('Prendé la opción.')).toBeTruthy());
    expect(document.querySelector('.manual-body')?.classList.contains('in-guide')).toBe(true);
    await waitFor(() => expect((history.state as { step?: string } | null)?.step).toBeDefined());
    // «Volver» con la hoja abierta cierra la hoja y sale: dos pasos atrás.
    fireEvent.click(screen.getByRole('button', { name: /Entrada/ }));
    expect(back.go).toHaveBeenCalledWith(1);
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Cerrar' }));
    expect(document.querySelector('.manual-body')?.classList.contains('in-guide')).toBe(false);
    // El botón atrás del celular también la cierra.
    fireEvent.click(
      screen.getAllByRole('button', { name: /Entrar sin internet/ })[0] as HTMLElement,
    );
    await waitFor(() => expect(sheet().classList.contains('open')).toBe(true));
    act(() => {
      dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(sheet().classList.contains('open')).toBe(false);
  });

  it('al agrandar la ventana, el paso a paso deja de ser una hoja', async () => {
    serveManual();
    const width = media({ narrow: true });
    show({ device: 'phone' });
    await loaded();
    expect(screen.queryByRole('button', { name: 'Cerrar' })).toBeNull();
    act(() => width.changeWidth(false));
    expect(screen.getAllByRole('button', { name: /Celular/ })[0]?.getAttribute('data-key')).toBe(
      'l',
    );
  });

  it('en el celular el consejo va solo en el último paso; «Seguir» pasa de tarea y «Terminé» cierra la hoja', async () => {
    serveManual();
    show({ device: 'phone', at: '/manual?d=phone&c=sign-in&t=offline&p=2' });
    await waitFor(() => expect(within(sheet()).getByText('Poné la huella.')).toBeTruthy());
    expect(sheet().classList.contains('last')).toBe(true);
    fireEvent.click(within(sheet()).getByRole('button', { name: /Seguir: Entrar con la huella/ }));
    await waitFor(() => expect(within(sheet()).getByText('Poné el dedo.')).toBeTruthy());
    fireEvent.click(within(sheet()).getByRole('button', { name: /Terminé/ }));
    expect(sheet().classList.contains('open')).toBe(false);
  });

  it('R6.4: «Trabajar sin conexión» lleva a la tarea de «Entrar» de este dispositivo', async () => {
    serveManual();
    show({ device: 'phone' });
    await loaded();
    const group = screen.getByRole('heading', { name: 'Trabajar sin conexión' });
    fireEvent.click(within(group.nextElementSibling as HTMLElement).getByRole('button'));
    await waitFor(() => expect(within(sheet()).getByText('Prendé la opción.')).toBeTruthy());
  });

  it('«Todos los pasos» desde la lista es otra hoja, que la × cierra', async () => {
    serveManual();
    show({ device: 'phone' });
    await loaded();
    fireEvent.click(
      screen.getByRole('button', { name: /Todos los pasos El capítulo entero, de corrido/ }),
    );
    const all = await screen.findByRole('region', { name: 'Entrar · todos los pasos' });
    await waitFor(() => expect(within(all).getByText('Entrás en el celular.')).toBeTruthy());
    fireEvent.click(within(all).getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('region', { name: /todos los pasos/ })).toBeNull();
  });
});

describe('el buscador del manual', () => {
  beforeEach(() => media());
  afterEach(() => vi.unstubAllGlobals());

  it('app-E36: lo encontrado del dispositivo elegido, con lo buscado marcado, y lleva a ese paso', async () => {
    const { asked } = serveManual();
    show();
    await loaded();
    await waitFor(() => expect(document.activeElement).toBe(search()));
    expect(asked).not.toContain('/manual/search-computer.json');
    fireEvent.input(search(), { target: { value: 'huella' } });
    const found = await screen.findByText('Entrar · 1 encontrada');
    expect(found).toBeTruthy();
    expect(document.querySelector('.manual-list mark')?.textContent).toBe('huella');
    fireEvent.click(screen.getByRole('button', { name: /Entrar con el celular Poné la huella/ }));
    await waitFor(() =>
      expect(within(screen.getByRole('main')).getByText('Paso 3 de 3')).toBeTruthy(),
    );
  });

  it('sin nada, lo dice; en pruebas, los capítulos que faltan que coinciden', async () => {
    serveManual();
    show();
    await loaded();
    fireEvent.input(search(), { target: { value: 'entrar' } });
    expect(await screen.findByText('Entrar · 2 encontradas')).toBeTruthy();
    fireEvent.input(search(), { target: { value: 'vender' } });
    expect(await screen.findByText('No encontré «vender»')).toBeTruthy();
    expect(screen.getAllByText('Pronto')).toHaveLength(1);
  });

  it('sin conexión, el buscador dice «Sin conexión»; con red otra vez, al escribir busca', async () => {
    serveManual({ 'search-computer.json': 'offline' });
    show();
    await loaded();
    fireEvent.input(search(), { target: { value: 'huella' } });
    expect(await screen.findByText('Sin conexión')).toBeTruthy();
    serveManual();
    fireEvent.input(search(), { target: { value: 'huell' } });
    expect(await screen.findByText('Entrar · 1 encontrada')).toBeTruthy();
  });

  it('una tarea del buscador que el índice ya no tiene sale con el ícono del capítulo', async () => {
    const old = [{ chapter: 'sign-in', task: 'vieja', title: 'Vieja', texts: ['Algo viejo.'] }];
    serveManual({ 'search-computer.json': old });
    show();
    await loaded();
    fireEvent.input(search(), { target: { value: 'viejo' } });
    expect(await screen.findByRole('button', { name: /Vieja/ })).toBeTruthy();
  });
});
