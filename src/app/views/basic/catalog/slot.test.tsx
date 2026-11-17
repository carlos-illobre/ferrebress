// El lugar de Catálogo: baja la pantalla de las listas y la muestra; sin red y sin poder bajarla, lo dice.
import { render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate } from '../../../platform/router.ts';

describe('el lugar de Catálogo', () => {
  afterEach(() => {
    navigate('/', { replace: true });
    vi.doUnmock('../price-lists/review/Review.tsx');
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

  it('en la dirección de una lista, ver qué cambia de esa lista', async () => {
    const listId = '0190e000-0000-7000-8000-000000000003';
    vi.doMock('../price-lists/review/Review.tsx', () => ({
      Review: ({ listId: shown }: { listId: string }) => <p>la lista {shown}</p>,
    }));
    navigate(`/catalog/lists/${listId}`);
    const { CatalogSlot } = await import('./Slot.tsx');
    render(<CatalogSlot />);
    expect(await screen.findByText(`la lista ${listId}`)).toBeTruthy();
  });

  it('sin red, tampoco ver qué cambia', async () => {
    vi.doMock('../price-lists/review/Review.tsx', () => Promise.reject(new Error('no está')));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    navigate('/catalog/lists/0190e000-0000-7000-8000-000000000003');
    const { CatalogSlot } = await import('./Slot.tsx');
    render(<CatalogSlot />);
    expect((await screen.findByRole('status')).textContent).toContain('Sin conexión');
  });

  it('sin red, dice «Sin conexión»', async () => {
    vi.doMock('../price-lists/Suppliers.tsx', () => Promise.reject(new Error('no está')));
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    const { CatalogSlot } = await import('./Slot.tsx');
    render(<CatalogSlot />);
    expect((await screen.findByRole('status')).textContent).toContain('Sin conexión');
  });
});
