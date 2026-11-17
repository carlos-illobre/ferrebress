// Subir una lista en los bordes: sin poder traer el tamaño máximo, sube igual; un aviso de una lista
// que ya se cerró no hace nada; leída, «Ver qué cambia» la abre.
import { act, fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate, route } from '../../../platform/router.ts';
import {
  listId,
  MB,
  openUploads,
  request,
  sheet,
  state,
} from '../../../views/basic/price-lists/uploads/kit.tsx';
import { startUploads } from './actions.ts';
import { uploads } from './store.ts';

describe('subir desde el modelo, en los bordes', () => {
  afterEach(() => {
    uploads.set([]);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sin el tamaño máximo, sube igual; y un aviso de una lista que ya se cerró no hace nada', async () => {
    const { topic, listening } = openUploads({
      '/api/administration': { status: 500, body: { error: 'unexpected' } },
    });
    await act(() => startUploads([sheet('grande.csv', 2 * MB)]));
    await waitFor(() => expect(request()?.path).toContain('name=grande.csv'));
    act(() => request().answer(201, state()));
    await waitFor(() => expect(listening()).toBe(true));
    act(() => uploads.set([]));
    await act(async () => topic({ status: 'reading', rowsRead: 1 }));
    expect(uploads.get()).toEqual([]);
  });

  it('price-lists-pantalla 2: leída y en espera, «Ver qué cambia» la abre y saca su tarjeta', async () => {
    const { topic, listening } = openUploads({
      '/api/price-lists/lists/0190e000-0000-7000-8000-000000000001': { body: state() },
    });
    await act(() => startUploads([sheet()]));
    await waitFor(() => expect(request()?.path).toContain('name=lista.xlsx'));
    act(() => request().answer(201, state()));
    await waitFor(() => expect(listening()).toBe(true));
    act(() => topic({ status: 'pending', rowsRead: 10 }));
    fireEvent.click(await screen.findByRole('button', { name: 'Ver qué cambia' }));
    expect(route.get().path).toBe(`/catalog/lists/${listId}`);
    expect(uploads.get()).toEqual([]);
    navigate('/', { replace: true });
  });
});
