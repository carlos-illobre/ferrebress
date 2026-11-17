// Cuando el código de Administración no se puede bajar: sin red, lo dice.
import { render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate } from '../../../platform/router.ts';
import { AdministrationSlot } from './Slot.tsx';

vi.mock('./Administration.tsx', () => Promise.reject(new Error('no está')));
vi.mock('../price-lists/Readers.tsx', () => Promise.reject(new Error('no está')));
vi.mock('../price-lists/Files.tsx', () => Promise.reject(new Error('no está')));

describe('el lugar de Administración', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sin red, dice «Sin conexión»', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(<AdministrationSlot />);
    expect((await screen.findByRole('status')).textContent).toContain('Sin conexión');
  });

  it.each(['readers', 'files'])('tampoco las que se abren desde ella (%s)', async (page) => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    navigate(`/administration/${page}`);
    render(<AdministrationSlot />);
    expect((await screen.findByRole('status')).textContent).toContain('Sin conexión');
    navigate('/', { replace: true });
  });
});
