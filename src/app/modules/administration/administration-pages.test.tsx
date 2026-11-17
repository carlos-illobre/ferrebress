// Lo que se abre desde Administración (06 · pantalla 1): Lectores para todos y Archivos de listas solo
// con «Ver costos».
import { fireEvent, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { navigate, route } from '../../platform/router.ts';
import { openAdministration, seller } from '../../views/basic/administration/kit.tsx';

describe('lo que se abre desde Administración', () => {
  it('price-lists-R5.8 y administration-R10.1: desde Administración se abren Lectores y Archivos de listas', async () => {
    openAdministration();
    fireEvent.click(await screen.findByRole('button', { name: /Lectores/ }));
    expect(route.get().path).toBe('/administration/readers');
    fireEvent.click(screen.getByRole('button', { name: /Archivos de listas/ }));
    expect(route.get().path).toBe('/administration/files');
    navigate('/', { replace: true });
  });

  it('administration-R10.3 y E45: sin «Ver costos» ni «Revisar las anomalías», Archivos de listas y Anomalías no se ofrecen', async () => {
    openAdministration({}, seller);
    await screen.findByRole('button', { name: /Lectores/ });
    expect(screen.queryByRole('button', { name: /Archivos de listas/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Anomalías/ })).toBeNull();
  });
});
