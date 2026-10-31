import { act, fireEvent, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { later } from '../../testing/later.ts';
import { media, open, withPath } from './frame-test-kit.tsx';
import { PhoneLight } from './index.ts';
import { moreOptions, type Option, parts } from './menu.ts';

describe('el marco en el celular', () => {
  beforeEach(() => media({ phone: true }));
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sign-in-E34: en el celular, «Salir» está en Más, con la persona y las opciones', async () => {
    media({ phone: true });
    const { onSignOut } = open();
    const phoneNav = screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement;
    const more = within(phoneNav).getByRole('button', { name: /Más/ });
    fireEvent.click(more);
    const screenMore = screen.getByRole('region', { name: 'Más' });
    expect(more.getAttribute('aria-current')).toBe('page');
    expect(
      within(phoneNav)
        .getByRole('button', { name: /Vender/ })
        .hasAttribute('aria-current'),
    ).toBe(false);
    expect(document.querySelector('.frame')?.classList.contains('more-open')).toBe(true);
    expect(within(screenMore).getByText('Rubén Paredes')).toBeTruthy();
    // Una sola lista, sin grupos (00 · R1.2).
    expect(screenMore.querySelectorAll('.phone-more-group')).toHaveLength(1);
    expect(within(screenMore).getByText('Lo que no coincide')).toBeTruthy();
    expect(within(screenMore).getAllByText('Pronto')).toHaveLength(5);
    const anomalies = within(screenMore).getByRole('button', { name: /Anomalías/ });
    expect(anomalies.querySelector('.phone-more-icon.urgent')).not.toBeNull();
    expect(anomalies.lastElementChild?.className).toBe('coming-soon');
    fireEvent.click(anomalies);
    expect(screen.getByRole('status').textContent).toBe('Anomalías · pronto. Todavía no está.');
    fireEvent.click(within(screenMore).getByRole('button', { name: /Salir/ }));
    await act(async () => {});
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('offline-E01: debajo de Configuración, el interruptor de otro módulo, que se toca entero', () => {
    const toggle = vi.fn();
    const setting = { name: 'Trabajar sin conexión', detail: 'Hasta 24 horas', on: false, toggle };
    open({ setting });
    fireEvent.click(
      within(screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement).getByRole(
        'button',
        { name: /Más/ },
      ),
    );
    const row = screen.getByRole('switch', { name: /Trabajar sin conexión/ });
    expect(row.getAttribute('aria-checked')).toBe('false');
    expect(row.closest('li')?.previousElementSibling?.textContent).toContain('Configuración');
    fireEvent.click(row);
    expect(toggle).toHaveBeenCalledOnce();
  });

  it('app-E02b, offline-E01: en producción también lo que falta, con «Pronto», y el interruptor debajo de Configuración', () => {
    const setting = {
      name: 'Trabajar sin conexión',
      detail: 'Hasta 24 horas',
      on: false,
      toggle: vi.fn(),
    };
    open({ testing: false, setting });
    fireEvent.click(
      within(screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement).getByRole(
        'button',
        { name: /Más/ },
      ),
    );
    const screenMore = screen.getByRole('region', { name: 'Más' });
    expect(within(screenMore).getAllByText('Pronto').length).toBeGreaterThan(0);
    const row = screen.getByRole('switch', { name: /Trabajar sin conexión/ });
    expect(row.closest('li')?.previousElementSibling?.textContent).toContain('Configuración');
  });

  it('app-E02b: en producción, Más tiene todas sus opciones, en el orden de la computadora', () => {
    open({ testing: false });
    fireEvent.click(
      within(screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement).getByRole(
        'button',
        { name: /Más/ },
      ),
    );
    const screenMore = screen.getByRole('region', { name: 'Más' });
    expect(
      within(screenMore.querySelector('.phone-more-group') as HTMLElement)
        .getAllByRole('button')
        .map((button) => button.querySelector('b')?.textContent),
    ).toEqual([
      'Anomalías',
      'Procesos',
      'Mejoras y errores',
      'Usuarios',
      'Configuración',
      'Administración',
      'Manual',
    ]);
  });

  it('en el celular, lo que no está lo dice una tostada que se va sola; la luz, bajo el título de la pantalla, abre lo pendiente', async () => {
    vi.useFakeTimers();
    media({ phone: true });
    // Sin cabecera del marco: la pantalla pone la luz debajo de su título.
    open({ screens: { users: () => <PhoneLight /> } });
    expect(document.querySelector('.phone-logo')).toBeNull();
    const phoneNav = screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement;
    fireEvent.click(within(phoneNav).getByRole('button', { name: /Catálogo/ }));
    expect(screen.getByRole('status').textContent).toBe('Catálogo · pronto. Todavía no está.');
    fireEvent.click(within(phoneNav).getByRole('button', { name: /Depósito/ }));
    await later(2400);
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(document.querySelector('.phone-light') as Element);
    expect(
      within(screen.getByRole('dialog', { name: 'Lo que está por enviar' })).getByText(
        'Todo enviado',
      ),
    ).toBeTruthy();
    fireEvent.click(
      within(screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement).getByRole(
        'button',
        { name: /Más/ },
      ),
    );
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Más' })).getByRole('button', { name: /En línea/ }),
    );
    expect(screen.getByRole('dialog', { name: 'Lo que está por enviar' })).toBeTruthy();
  });

  it('se sale de Más tocando la parte abierta o con el botón atrás del celular', () => {
    // happy-dom no vuelve atrás de verdad: se ve que lo pide y se hace como el navegador.
    const back = vi.spyOn(history, 'back').mockImplementation(() => {
      dispatchEvent(new PopStateEvent('popstate'));
    });
    withPath(parts[0] as Option, '/', () => {
      open();
      const phoneNav = screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement;
      const more = within(phoneNav).getByRole('button', { name: /Más/ });
      fireEvent.click(more);
      fireEvent.click(more);
      act(() => {
        fireEvent.click(within(phoneNav).getByRole('button', { name: /Vender/ }));
      });
      expect(back).toHaveBeenCalledOnce();
      expect(screen.queryByRole('region', { name: 'Más' })).toBeNull();
      back.mockRestore();
      fireEvent.click(more);
      act(() => {
        dispatchEvent(new PopStateEvent('popstate'));
      });
      expect(screen.queryByRole('region', { name: 'Más' })).toBeNull();
    });
  });

  it('en el celular, una opción que existe se abre, desde el menú de abajo o desde Más', () => {
    const sell = parts[0] as Option;
    const tickets = moreOptions[2] as Option;
    sell.path = '/sell';
    tickets.path = '/tickets';
    try {
      open();
      const phoneNav = screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement;
      const item = within(phoneNav).getByRole('button', { name: /Vender/ });
      expect(item.textContent).toBe('Vender');
      fireEvent.click(item);
      expect(location.pathname).toBe('/sell');
      fireEvent.click(within(phoneNav).getByRole('button', { name: /Más/ }));
      const tickets = within(screen.getByRole('region', { name: 'Más' })).getByRole('button', {
        name: /Mejoras/,
      });
      expect(tickets.querySelector('.coming-soon')).toBeNull();
      fireEvent.click(tickets);
      expect(location.pathname).toBe('/tickets');
    } finally {
      delete sell.path;
      delete tickets.path;
    }
  });
});
