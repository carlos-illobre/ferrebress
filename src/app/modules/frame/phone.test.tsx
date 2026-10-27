import { act, fireEvent, screen, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { later } from '../../testing/later.ts';
import { media, open } from './frame-test-kit.tsx';
import { moreOptions, type Option, parts } from './menu.ts';

describe('el marco en el celular', () => {
  beforeEach(() => media({ phone: true }));
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('01-E34: en el celular, «Salir» está en Más, con la persona y las opciones', async () => {
    media({ phone: true });
    const { onSignOut } = open();
    const phoneNav = screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement;
    const more = within(phoneNav).getByRole('button', { name: /Más/ });
    fireEvent.click(more);
    const sheet = screen.getByRole('dialog', { name: 'Más' });
    expect(more.getAttribute('aria-expanded')).toBe('true');
    expect(within(sheet).getByText('Rubén Paredes')).toBeTruthy();
    expect(within(sheet).getAllByText('Pronto')).toHaveLength(6);
    fireEvent.click(within(sheet).getByRole('button', { name: /Anomalías/ }));
    expect(screen.getByRole('status').textContent).toBe('Anomalías · pronto. Todavía no está.');
    fireEvent.click(within(sheet).getByRole('button', { name: /Salir/ }));
    await act(async () => {});
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('en el celular, lo que no está lo dice una tostada que se va sola; la luz abre lo pendiente', async () => {
    vi.useFakeTimers();
    media({ phone: true });
    open();
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
    fireEvent.click(document.querySelector('.phone-avatar') as Element);
    expect(screen.getByRole('dialog', { name: 'Más' })).toBeTruthy();
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
      fireEvent.click(
        within(screen.getByRole('dialog', { name: 'Más' })).getByRole('button', {
          name: /Mejoras/,
        }),
      );
      expect(location.pathname).toBe('/tickets');
    } finally {
      delete sell.path;
      delete tickets.path;
    }
  });
});
