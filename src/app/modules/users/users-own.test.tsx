// La tarjeta propia en Usuarios (02 · R5.5; 04 · E46): los celulares propios, como en Configuración,
// con la misma lógica para quitarlos, también el que se tiene en la mano (04 · R6.2).
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { inCard, openUsers, row } from './users-test-kit.tsx';

const choose = async (name: RegExp) => {
  await screen.findByText('Rubén Paredes');
  fireEvent.click(row(name));
};

describe('la tarjeta propia', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('users-R5.5, E22, device-settings-E46: en la propia, sus celulares con su nombre, y se quita el que está en la mano', async () => {
    const phone = { id: 'f9', deviceLabel: 'Chrome', deviceName: 'Celu de Rubén', createdAt: 0 };
    const server = openUsers({
      '/api/users/ruben/access': [
        { body: { sessions: [], phones: [{ ...phone, lastUsedAt: null }] } },
        { body: { sessions: [], phones: [] } },
      ],
      '/api/users/ruben/phones/f9/cut': { body: { sessions: 0, passkey: true } },
    });
    await choose(/Rubén/);
    expect(await inCard().findByText(/La sesión de esta computadora no figura/)).toBeTruthy();
    expect(inCard().getByText('Celu de Rubén')).toBeTruthy();
    fireEvent.click(inCard().getByRole('button', { name: 'Quitar' }));
    await waitFor(() => expect(inCard().queryByText('Celu de Rubén')).toBeNull());
    expect(server.bodies('/api/users/ruben/phones/f9/cut')).toEqual([{ from: 'card' }]);
  });
});
