import { act, fireEvent, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startKeyboard } from '../../platform/keyboard.ts';
import { online } from '../../platform/server/api.ts';
import { later } from '../../testing/later.ts';
import { alt, media, open, press } from './frame-test-kit.tsx';
import { moreOptions, type Option, parts } from './menu.ts';

describe('el marco', () => {
  beforeEach(() => media());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    online.set(true);
  });

  it('sign-in-E37, app-E01, app-E51: en pruebas, el menú con todo en «Pronto», la luz, la persona y el área en blanco', () => {
    const { side } = open();
    const names = within(side)
      .getAllByRole('button')
      .map((button) => button.querySelector('.part-name')?.textContent)
      .filter(Boolean);
    expect(names).toEqual(['Vender', 'Catálogo', 'Depósito', 'Negocio', 'Más']);
    expect(within(side).getAllByText('Pronto')).toHaveLength(4);
    // Lo primero que existe es Usuarios, en Más (R1.4).
    expect(within(side).getByRole('button', { name: /Más/ }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(within(side).getByText('En línea · todo enviado')).toBeTruthy();
    const card = screen.getByRole('region', { name: 'Tu sesión' });
    expect(within(card).getByText('Rubén Paredes')).toBeTruthy();
    expect(within(card).getByText('Administrador')).toBeTruthy();
    expect(within(card).getByRole('button', { name: /Salir/ })).toBeTruthy();
    expect(screen.getByRole('main', { name: 'Área de trabajo' }).innerHTML).toBe('');
    expect(document.querySelector('.test-banner')?.textContent).toBe(
      'Ambiente de prueba · nada de esto es real',
    );
  });

  it('app-E02b, app-E52: en producción también está lo que falta, con «Pronto», sin el marco magenta', () => {
    const { side } = open({ testing: false });
    expect(within(side).getAllByText('Pronto')).toHaveLength(4);
    expect(side.querySelector('[aria-current="page"]')?.textContent).toContain('Más');
    expect(document.querySelector('.test-frame')).toBeNull();
  });

  it('app-E02: lo que todavía no existe no se abre: se sacude y el globo lo dice, y se va solo', async () => {
    vi.useFakeTimers();
    const { side } = open();
    const sell = within(side).getByRole('button', { name: /Vender/ });
    fireEvent.click(sell);
    expect(sell.classList.contains('not-here')).toBe(true);
    expect(screen.getByRole('status').textContent).toContain('Vender todavía no está');
    expect(location.pathname).toBe('/');
    await later(2600);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('sign-in-E34: en la computadora, «Salir» está en la tarjeta de la persona', async () => {
    const { onSignOut } = open();
    fireEvent.click(within(screen.getByRole('region', { name: 'Tu sesión' })).getByRole('button'));
    await act(async () => {});
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('app-E20, app-E21: la luz dice lo que pasa con la conexión, sin preguntar nada', () => {
    const { side } = open();
    act(() => online.set(false));
    expect(within(side).getByText('Sin conexión · nada por enviar')).toBeTruthy();
    fireEvent.click(within(side).getByRole('button', { name: /Sin conexión/ }));
    const panel = screen.getByRole('dialog', { name: 'Lo que está por enviar' });
    expect(within(panel).getByText('Sin conexión')).toBeTruthy();
  });

  it('app-E03b: el menú se minimiza a sus íconos y se vuelve a agrandar, con su animación', async () => {
    vi.useFakeTimers();
    open();
    const frame = document.querySelector('.frame') as HTMLElement;
    const collapse = screen.getByRole('button', { name: 'Minimizar el menú' });
    fireEvent.click(collapse);
    fireEvent.click(collapse);
    expect(frame.className).toBe('frame closing');
    await later(240);
    expect(frame.className).toBe('frame collapsed');
    expect(collapse.getAttribute('aria-label')).toBe('Agrandar el menú');
    fireEvent.click(collapse);
    expect(frame.className).toBe('frame opening');
    await later(340);
    expect(frame.className).toBe('frame');
  });

  it('con «reducir movimiento», minimizar no anima', () => {
    media({ reduced: true });
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Minimizar el menú' }));
    expect(document.querySelector('.frame')?.className).toBe('frame collapsed');
  });

  it('app-R1.6: minimizado, cada ícono dice su nombre al pasar el mouse o al llegar con la marca', () => {
    media({ reduced: true });
    const stop = startKeyboard();
    const { side } = open();
    const collapse = screen.getByRole('button', { name: 'Minimizar el menú' });
    fireEvent.pointerEnter(collapse, { pointerType: 'mouse' });
    expect(document.querySelector('.tip.label')?.textContent).toBe('Minimizar el menú');
    fireEvent.pointerLeave(collapse);
    fireEvent.pointerEnter(within(side).getByRole('button', { name: /Vender/ }), {
      pointerType: 'mouse',
    });
    expect(document.querySelector('.tip')).toBeNull();
    fireEvent.click(collapse);
    fireEvent.pointerEnter(within(side).getByRole('button', { name: /Vender/ }), {
      pointerType: 'touch',
    });
    expect(document.querySelector('.tip')).toBeNull();
    act(() => press('ArrowDown'));
    act(() => press('ArrowDown'));
    expect(document.querySelector('.tip.label')?.textContent).toBe('Vender · Pronto');
    fireEvent.pointerEnter(screen.getByRole('button', { name: 'Rubén Paredes, Administrador' }), {
      pointerType: 'mouse',
    });
    expect(document.querySelector('.tip.label')?.textContent).toBe('Rubén Paredes · Administrador');
    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });
    expect(document.querySelector('.tip')).toBeNull();
    stop();
  });

  it('app-E14: Más se abre con → al costado; con Alt solo se ven sus teclas, y Esc lo cierra', async () => {
    const stop = startKeyboard();
    const { side } = open();
    const more = within(side).getByRole('button', { name: /Más/ });
    more.classList.add('marked');
    act(() => press('ArrowRight'));
    await act(() => new Promise((resolve) => setTimeout(resolve)));
    const panel = screen.getByRole('list', { name: 'Más' });
    expect(
      within(panel)
        .getByRole('button', { name: /Anomalías/ })
        .classList.contains('marked'),
    ).toBe(true);
    expect(panel.classList.contains('side-panel')).toBe(true);
    act(() => alt('Alt'));
    expect(panel.classList.contains('show-keys')).toBe(true);
    act(() => press('Escape'));
    await act(() => new Promise((resolve) => setTimeout(resolve)));
    expect(screen.queryByRole('list', { name: 'Más' })).toBeNull();
    expect(more.classList.contains('marked')).toBe(true);
    stop();
  });

  it('lo abierto se cierra al tocar afuera o al cambiar el tamaño de la ventana', () => {
    const { side } = open();
    const more = within(side).getByRole('button', { name: /Más/ });
    fireEvent.click(more);
    fireEvent.click(screen.getByRole('main'));
    expect(screen.queryByRole('list', { name: 'Más' })).toBeNull();
    fireEvent.click(more);
    fireEvent.click(
      within(screen.getByRole('list', { name: 'Más' })).getByRole('button', { name: /Manual/ }),
    );
    expect(screen.getByRole('list', { name: 'Más' })).toBeTruthy();
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(screen.queryByRole('list', { name: 'Más' })).toBeNull();
  });

  it('minimizado, las iniciales abren la tarjeta al costado, que solo deja usar sus teclas; lo pendiente se cierra con Alt C', () => {
    media({ reduced: true });
    const stop = startKeyboard();
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Minimizar el menú' }));
    const initials = screen.getByRole('button', { name: 'Rubén Paredes, Administrador' });
    fireEvent.click(initials);
    expect(initials.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('region', { name: 'Tu sesión' }).classList.contains('open')).toBe(true);
    act(() => alt('z'));
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => press('Escape'));
    expect(screen.getByRole('region', { name: 'Tu sesión' }).classList.contains('open')).toBe(
      false,
    );
    act(() => alt('z'));
    expect(screen.getByRole('dialog', { name: 'Lo que está por enviar' })).toBeTruthy();
    act(() => alt('c'));
    expect(screen.queryByRole('dialog')).toBeNull();
    stop();
  });

  it('app-E01: abre la primera opción que existe, y tocar una que existe la abre', () => {
    const catalog = parts[1] as Option;
    const manual = moreOptions.find((option) => option.id === 'manual') as Option;
    catalog.path = '/catalog';
    manual.path = '/manual';
    try {
      const { side } = open({ testing: false });
      const item = within(side).getByRole('button', { name: /Catálogo/ });
      expect(item.getAttribute('aria-current')).toBe('page');
      expect(item.querySelector('.coming-soon')).toBeNull();
      expect(within(side).getByRole('button', { name: /Vender/ }).textContent).toContain('Pronto');
      fireEvent.click(item);
      expect(location.pathname).toBe('/catalog');
      fireEvent.click(within(side).getByRole('button', { name: /Más/ }));
      fireEvent.click(
        within(screen.getByRole('list', { name: 'Más' })).getByRole('button', { name: /Manual/ }),
      );
      expect(location.pathname).toBe('/manual');
    } finally {
      delete catalog.path;
      delete manual.path;
    }
  });

  it('Más se cierra tocándolo otra vez; el globo de «todavía no está» no se va con la marca', () => {
    const stop = startKeyboard();
    const { side } = open();
    const more = within(side).getByRole('button', { name: /Más/ });
    fireEvent.click(more);
    fireEvent.click(more);
    expect(screen.queryByRole('list', { name: 'Más' })).toBeNull();
    act(() => press('ArrowDown'));
    fireEvent.click(within(side).getByRole('button', { name: /Vender/ }));
    act(() => {
      window.dispatchEvent(new Event('mousemove'));
    });
    expect(screen.getByRole('status').textContent).toContain('Vender todavía no está');
    stop();
  });

  it('al minimizar con la marca en el botón, el rótulo lo sigue diciendo', async () => {
    vi.useFakeTimers();
    const stop = startKeyboard();
    open();
    act(() => press('ArrowDown'));
    act(() => alt('e'));
    await later(241);
    expect(document.querySelector('.tip.label')?.textContent).toBe('Agrandar el menú');
    stop();
  });
});
