// La tarjeta en el celular (referencia de Carlos): los tres botones de arriba y los renglones de
// abajo, que hacen lo mismo que la tarjeta de la computadora; lo que todavía no está lo dice.
import { fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { access, card, inCard, openUsers, row, toast } from './users-test-kit.tsx';

const tile = (name: RegExp) =>
  within(card().querySelector('.users-tiles') as HTMLElement).getByRole('button', { name });
const linkRow = (name: RegExp) =>
  within(card().querySelector('.users-link-rows') as HTMLElement).getByRole('button', { name });

describe('la tarjeta en el celular', () => {
  afterEach(() => vi.restoreAllMocks());

  it('«Cortar sesión» pide confirmar «Cerrar todas»; «Cambiar rol» y el historial, todavía no', async () => {
    openUsers({ '/api/users/graciela/access': { body: access } });
    await screen.findByText('Rubén Paredes');
    fireEvent.click(row(/Graciela/));
    await inCard().findByText('Chrome en Windows');
    fireEvent.click(tile(/Cambiar rol/));
    expect(toast()).toBe('Cambiar rol · pronto. Todavía no está.');
    fireEvent.click(linkRow(/Historial de acceso/));
    expect(toast()).toBe('Historial de acceso · pronto. Todavía no está.');
    fireEvent.click(inCard().getByRole('button', { name: /Ver historial/ }));
    expect(toast()).toBe('Ver historial · pronto. Todavía no está.');
    expect(linkRow(/Huella digital/).textContent).toContain('2 registradas');
    expect(linkRow(/Dispositivos/).textContent).toContain('2 con sesión');
    fireEvent.click(tile(/Cortar sesión/));
    expect(screen.getByRole('alertdialog', { name: /sesiones de Graciela/ })).toBeTruthy();
  });

  it('con varios celulares, «Quitar huella» y los renglones llevan a su parte de la tarjeta', async () => {
    const scrolled = vi.fn();
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(scrolled);
    openUsers({ '/api/users/graciela/access': { body: access } });
    await screen.findByText('Rubén Paredes');
    fireEvent.click(row(/Graciela/));
    await inCard().findByText('Chrome en Windows');
    scrolled.mockClear();
    fireEvent.click(tile(/Quitar huella/));
    fireEvent.click(linkRow(/Huella digital/));
    fireEvent.click(linkRow(/Dispositivos/));
    expect(scrolled).toHaveBeenCalledTimes(3);
  });

  it('con un solo celular, «Quitar huella» lo quita; sin ninguno, está apagado', async () => {
    const one = { ...access, phones: access.phones.slice(0, 1) };
    const server = openUsers({
      '/api/users/graciela/access': [{ body: one }, { body: { sessions: [], phones: [] } }],
      '/api/users/graciela/phones/f1/cut': { body: { sessions: 0, passkey: true } },
    });
    await screen.findByText('Rubén Paredes');
    fireEvent.click(row(/Graciela/));
    await inCard().findByText('Chrome en Windows');
    fireEvent.click(tile(/Quitar huella/));
    await waitFor(() => expect(server.bodies('/api/users/graciela/phones/f1/cut')).toHaveLength(1));
    await waitFor(() => expect((tile(/Quitar huella/) as HTMLButtonElement).disabled).toBe(true));
    expect((tile(/Cortar sesión/) as HTMLButtonElement).disabled).toBe(true);
  });
});
