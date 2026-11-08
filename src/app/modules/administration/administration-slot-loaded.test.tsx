// El lugar de Administración baja la pantalla y la muestra.
import { render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { AdministrationSlot } from './index.ts';

vi.mock('./screens/Administration/Administration.tsx', () => ({
  Administration: () => <p>la pantalla</p>,
}));

describe('el lugar de Administración', () => {
  it('con el código bajado, muestra la pantalla', async () => {
    render(<AdministrationSlot />);
    expect(await screen.findByText('la pantalla')).toBeTruthy();
  });
});
