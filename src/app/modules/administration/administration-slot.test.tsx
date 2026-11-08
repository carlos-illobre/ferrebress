// Cuando el código de Administración no se puede bajar: sin red, lo dice.
import { render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdministrationSlot } from './index.ts';

vi.mock('./screens/Administration/Administration.tsx', () => Promise.reject(new Error('no está')));

describe('el lugar de Administración', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sin red, dice «Sin conexión»', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    render(<AdministrationSlot />);
    expect((await screen.findByRole('status')).textContent).toContain('Sin conexión');
  });
});
