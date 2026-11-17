import { act, fireEvent, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { later } from '../../testing/later.ts';
import { withoutCatalog } from '../../testing/menu.ts';
import {
  everyone,
  firstGroupNames,
  isUrgent,
  media,
  moreOpenOnPhone,
  open,
  phoneGroups,
  phoneLight,
  phoneLogoShown,
  withPath,
} from '../../views/basic/frame/frame-test-kit.tsx';
import { PhoneLight } from '../../views/basic/frame/index.ts';
import { saysSoon } from '../../views/basic/kit.ts';
import { moreOptions, type Option, parts } from './menu.ts';

withoutCatalog();

describe('el marco en el celular', () => {
  beforeEach(() => media({ phone: true }));
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('sign-in-E34: en el celular, «Salir» está en Más, con la persona y las opciones', async () => {
    media({ phone: true });
    const { onSignOut } = open({ who: everyone });
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
    expect(moreOpenOnPhone()).toBe(true);
    expect(within(screenMore).getByText('Rubén Paredes')).toBeTruthy();
    // Una sola lista, sin grupos (00 · R1.2).
    expect(phoneGroups(screenMore)).toHaveLength(1);
    expect(within(screenMore).getByText('Lo que no coincide')).toBeTruthy();
    expect(within(screenMore).getAllByText('Pronto')).toHaveLength(2);
    expect(isUrgent(within(screenMore).getByRole('button', { name: /Anomalías/ }))).toBe(true);
    const processes = within(screenMore).getByRole('button', { name: /Procesos/ });
    expect(processes.lastElementChild?.className).toBe('coming-soon');
    fireEvent.click(processes);
    expect(screen.getByRole('status').textContent).toBe('Procesos · pronto. Todavía no está.');
    fireEvent.click(within(screenMore).getByRole('button', { name: /Salir/ }));
    await act(async () => {});
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('app-E02b, device-settings-E28: en producción también lo que falta, con «Pronto»; «Trabajar sin conexión» ya no está en Más', () => {
    open({ testing: false });
    fireEvent.click(
      within(screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement).getByRole(
        'button',
        { name: /Más/ },
      ),
    );
    const screenMore = screen.getByRole('region', { name: 'Más' });
    expect(within(screenMore).getAllByText('Pronto').length).toBeGreaterThan(0);
    expect(screen.queryByRole('switch', { name: /Trabajar sin conexión/ })).toBeNull();
  });

  it('app-E02b: en producción, Más tiene todas sus opciones, en el orden de la computadora', () => {
    open({ testing: false, who: everyone });
    fireEvent.click(
      within(screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement).getByRole(
        'button',
        { name: /Más/ },
      ),
    );
    const screenMore = screen.getByRole('region', { name: 'Más' });
    expect(firstGroupNames(screenMore)).toEqual([
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
    expect(phoneLogoShown()).toBe(false);
    const phoneNav = screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement;
    fireEvent.click(within(phoneNav).getByRole('button', { name: /Catálogo/ }));
    expect(screen.getByRole('status').textContent).toBe('Catálogo · pronto. Todavía no está.');
    fireEvent.click(within(phoneNav).getByRole('button', { name: /Depósito/ }));
    await later(2400);
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(phoneLight());
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
    // happy-dom no vuelve atrás de verdad: se ve que lo pide y se hace como el navegador, que deja
    // el paso de antes y avisa.
    const back = vi.spyOn(history, 'back').mockImplementation(() => {
      history.replaceState(null, '');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    withPath(parts[0] as Option, '/', () => {
      open();
      // Lo que dejó pendiente la prueba anterior (happy-dom no vuelve atrás de verdad) no cuenta.
      back.mockClear();
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
      expect(saysSoon(tickets)).toBe(false);
      fireEvent.click(tickets);
      expect(location.pathname).toBe('/tickets');
    } finally {
      delete sell.path;
      delete tickets.path;
    }
  });
});
