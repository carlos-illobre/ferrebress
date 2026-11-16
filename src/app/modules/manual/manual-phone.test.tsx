import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  headerOf,
  inGuide,
  isLast,
  isOpen,
  loaded,
  mainOf,
  media,
  one,
  serveManual,
  show,
} from '../../views/basic/manual/manual-test-kit.tsx';

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

  it('R2.12, constitución III: en el celular no se baja nada más que el índice hasta tocar una tarea', async () => {
    const { asked } = serveManual();
    show({ device: 'phone' });
    await loaded();
    expect(asked).toEqual(['/manual/index.json']);
    expect(document.activeElement).not.toBe(search());
    expect(screen.queryByText('Stock')).toBeNull();
  });

  it('las tareas a pantalla entera; tocar una abre la hoja, que atrás o la × cierran', async () => {
    serveManual();
    const back = show({ device: 'phone' });
    await loaded();
    expect(inGuide()).toBe(false);
    fireEvent.click(
      screen.getAllByRole('button', { name: /Entrar sin internet/ })[0] as HTMLElement,
    );
    await waitFor(() => expect(within(sheet()).getByText('Prendé la opción.')).toBeTruthy());
    expect(inGuide()).toBe(true);
    await waitFor(() => expect((history.state as { step?: string } | null)?.step).toBeDefined());
    // «Volver» con la hoja abierta cierra la hoja y sale: dos pasos atrás.
    fireEvent.click(screen.getByRole('button', { name: /Entrada/ }));
    expect(back.go).toHaveBeenCalledWith(1);
    fireEvent.click(within(sheet()).getByRole('button', { name: 'Cerrar' }));
    expect(inGuide()).toBe(false);
    // El botón atrás del celular también la cierra.
    fireEvent.click(
      screen.getAllByRole('button', { name: /Entrar sin internet/ })[0] as HTMLElement,
    );
    await waitFor(() => expect(isOpen(sheet())).toBe(true));
    act(() => {
      dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(isOpen(sheet())).toBe(false);
  });

  it('al agrandar la ventana, el paso a paso deja de ser una hoja', async () => {
    serveManual();
    const width = media({ narrow: true });
    show({ device: 'phone' });
    await loaded();
    expect(screen.queryByRole('button', { name: 'Cerrar' })).toBeNull();
    act(() => width.changeWidth(false));
    // Arriba, la barra de la computadora, con los dispositivos.
    expect(
      headerOf(screen.getAllByRole('button', { name: /Celular/ })[0] as HTMLElement),
    ).toBeTruthy();
  });

  it('en el celular el consejo va solo en el último paso; «Seguir» pasa de tarea y «Terminé» cierra la hoja', async () => {
    serveManual();
    show({ device: 'phone', at: '/manual?d=phone&c=sign-in&t=offline&p=2' });
    await waitFor(() => expect(within(sheet()).getByText('Poné la huella.')).toBeTruthy());
    expect(isLast(sheet())).toBe(true);
    fireEvent.click(within(sheet()).getByRole('button', { name: /Seguir: Entrar con la huella/ }));
    await waitFor(() => expect(within(sheet()).getByText('Poné el dedo.')).toBeTruthy());
    fireEvent.click(within(sheet()).getByRole('button', { name: /Terminé/ }));
    expect(isOpen(sheet())).toBe(false);
  });

  it('R6.4: «Trabajar sin conexión» lleva a la tarea de «Entrar» de este dispositivo', async () => {
    serveManual();
    show({ device: 'phone' });
    await loaded();
    const fold = screen.getByRole('button', { name: 'Trabajar sin conexión' });
    expect(fold.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(fold);
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
    expect(one('found')?.textContent).toBe('huella');
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

  it('R4.4: en el celular, el capítulo sin red dice «Sin conexión» en la hoja, que se cierra', async () => {
    media({ narrow: true });
    serveManual({ 'sign-in.json': 'offline' });
    show({ device: 'phone' });
    await loaded();
    fireEvent.click(
      screen.getAllByRole('button', { name: /Entrar sin internet/ })[0] as HTMLElement,
    );
    await screen.findByRole('heading', { name: 'Sin conexión' });
    // El botón atrás la cierra, como cualquier hoja.
    await waitFor(() => expect((history.state as { step?: string } | null)?.step).toBeDefined());
    act(() => {
      dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.queryByRole('heading', { name: 'Sin conexión' })).toBeNull();
    fireEvent.click(
      screen.getAllByRole('button', { name: /Entrar sin internet/ })[0] as HTMLElement,
    );
    const empty = await screen.findByRole('heading', { name: 'Sin conexión' });
    fireEvent.click(within(mainOf(empty)).getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('heading', { name: 'Sin conexión' })).toBeNull();
  });
});
