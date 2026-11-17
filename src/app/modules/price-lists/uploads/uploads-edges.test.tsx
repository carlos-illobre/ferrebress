// Subir una lista en los bordes: sin poder traer el tamaño máximo, sube igual; un aviso de una lista
// que ya se cerró no hace nada.
import { act, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
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
});
