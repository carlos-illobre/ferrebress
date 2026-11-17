// El lugar de Catálogo: baja la pantalla de las listas y la muestra; sin red y sin poder bajarla, lo dice.
import { render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('el lugar de Catálogo', () => {
  afterEach(() => {
    vi.doUnmock('../price-lists/Suppliers.tsx');
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('con el código bajado, muestra las listas', async () => {
    vi.doMock('../price-lists/Suppliers.tsx', () => ({ Suppliers: () => <p>las listas</p> }));
    const { CatalogSlot } = await import('./Slot.tsx');
    render(<CatalogSlot />);
    expect(await screen.findByText('las listas')).toBeTruthy();
  });

  it('sin red, dice «Sin conexión»', async () => {
    vi.doMock('../price-lists/Suppliers.tsx', () => Promise.reject(new Error('no está')));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { CatalogSlot } = await import('./Slot.tsx');
    render(<CatalogSlot />);
    expect((await screen.findByRole('status')).textContent).toContain('Sin conexión');
  });
});
