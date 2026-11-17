// El lugar de Administración baja la pantalla que dice la dirección y la muestra: los ajustes o
// Lectores.
import { render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate } from '../../../platform/router.ts';
import { AdministrationSlot } from './Slot.tsx';

vi.mock('./Administration.tsx', () => ({
  Administration: () => <p>la pantalla</p>,
}));
vi.mock('../price-lists/Readers.tsx', () => ({
  Readers: () => <p>los lectores</p>,
}));

describe('el lugar de Administración', () => {
  afterEach(() => {
    navigate('/', { replace: true });
  });

  it('con el código bajado, muestra la pantalla', async () => {
    render(<AdministrationSlot />);
    expect(await screen.findByText('la pantalla')).toBeTruthy();
  });

  it('en su dirección, muestra Lectores', async () => {
    navigate('/administration/readers');
    render(<AdministrationSlot />);
    expect(await screen.findByText('los lectores')).toBeTruthy();
  });
});
