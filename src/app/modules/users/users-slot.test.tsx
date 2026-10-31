// Cuando el código de Usuarios no se puede bajar: con red es una versión vieja y se pide actualizar;
// sin red, lo dice.
import { render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { updateRequired } from '../../platform/server/api.ts';
import { UsersSlot } from './index.ts';

vi.mock('./screens/Users/Users.tsx', () => Promise.reject(new Error('no está')));

describe('el lugar de Usuarios', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    updateRequired.set(false);
  });

  it('con red, un código que no se puede bajar pide actualizar', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
    render(<UsersSlot testing />);
    await waitFor(() => expect(updateRequired.get()).toBe(true));
  });

  it('sin red, dice «Sin conexión»', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(<UsersSlot testing />);
    expect((await screen.findByRole('status')).textContent).toContain('Sin conexión');
  });
});
