// Más → Manual (00 · R6.1, R6.7, R4.4): abre el manual guardando de dónde se viene, y sin conexión se
// pone gris con «Sin conexión».
import { act, fireEvent, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate } from '../../platform/router.ts';
import { online } from '../../platform/server/api.ts';
import { media, open, withPath } from './frame-test-kit.tsx';
import { moreOptions, type Option } from './menu.ts';

const sideMore = (side: HTMLElement) => within(side).getByRole('button', { name: /^Más/ });

describe('el Manual en Más', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    act(() => online.set(true));
    navigate('/', { replace: true });
  });

  it('en la computadora guarda la opción abierta', () => {
    media();
    const { side } = open();
    fireEvent.click(sideMore(side));
    fireEvent.click(within(side).getByRole('button', { name: /Manual/ }));
    expect(history.state).toEqual({ from: 'users' });
  });

  it('sin ninguna opción que exista, guarda la primera parte, que queda abierta', () => {
    media();
    withPath(moreOptions.find((option) => option.id === 'users') as Option, undefined, () => {
      const { side } = open({ testing: false });
      fireEvent.click(sideMore(side));
      fireEvent.click(within(side).getByRole('button', { name: /Manual/ }));
    });
    expect(history.state).toEqual({ from: 'sell' });
  });

  it('sin conexión, gris y con «Sin conexión», en la computadora y en Más del celular', () => {
    media();
    const { side } = open();
    act(() => online.set(false));
    fireEvent.click(sideMore(side));
    const manual = within(side).getByRole('button', { name: /Manual/ });
    expect(manual.hasAttribute('disabled')).toBe(true);
    expect(manual.getAttribute('data-detail')).toBe('Sin conexión');
    expect(manual.textContent).toContain('Sin conexión');
  });

  it('en el celular, desde Más guarda «more»; sin conexión, gris', () => {
    media({ phone: true });
    open();
    const phoneNav = screen.getAllByRole('navigation', { name: 'Menú' })[1] as HTMLElement;
    fireEvent.click(within(phoneNav).getByRole('button', { name: /Más/ }));
    const more = screen.getByRole('region', { name: 'Más' });
    fireEvent.click(within(more).getByRole('button', { name: /Manual/ }));
    expect(history.state).toEqual({ from: 'more' });
    act(() => online.set(false));
    const manual = within(more).getByRole('button', { name: /Manual/ });
    expect(manual.hasAttribute('disabled')).toBe(true);
    expect(manual.textContent).toContain('Sin conexión');
  });
});
