// El espejo de las listas que se suben (08 · R1.6, E08): el otro dispositivo ve el avance de la subida
// y, cuando la lista existe, la sigue como suya; lo que se sube acá viaja al otro.
import { act, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { mirror } from '../../../platform/mirror/registry.ts';
import {
  listId,
  listPath,
  openUploads,
  request,
  sheet,
  state,
} from '../../../views/basic/price-lists/uploads/kit.tsx';
import { startUploads } from './actions.ts';
import { arrived, ownOf, watchUploads } from './mirror.ts';
import { uploads } from './store.ts';

// Este es la computadora (el navegador de las pruebas no es un celular); lo de enfrente, el celular.
watchUploads();
let clock = 1000;
const fromPhone = (value: unknown) =>
  act(() =>
    mirror.receive([{ k: 'price-lists.uploads.phone', v: value as never, c: ++clock, l: true }]),
  );

describe('el espejo de lo que se sube', () => {
  afterEach(() => {
    uploads.set([]);
    mirror.detach();
  });

  it('price-lists-E08: lo que sube el celular se ve acá con su avance, y después se sigue por el tema', async () => {
    const { topic, listening } = openUploads({ [listPath]: { body: state() } });
    fromPhone([{ key: 'u9', fileName: 'lista.xlsx', sent: 40, listId: null }]);
    expect(await screen.findByText('Subiendo en el celular… 40 %')).toBeTruthy();
    // Mientras la sube el celular, acá no se corta ni se elige el alcance.
    expect(screen.queryByRole('button', { name: 'Cancelar' })).toBeNull();
    fromPhone([{ key: 'u9', fileName: 'lista.xlsx', sent: 100, listId }]);
    await waitFor(() => expect(listening()).toBe(true));
    act(() => topic({ status: 'reading', rowsRead: 50, rowsTotal: 100 }));
    expect(await screen.findByText(/50 de 100/)).toBeTruthy();
    // Una que el celular dejó de subir antes de existir se va; una que ya existe sigue.
    fromPhone([{ key: 'u8', fileName: 'otra.xlsx', sent: 10, listId: null }]);
    expect(await screen.findByText('otra.xlsx')).toBeTruthy();
    fromPhone([]);
    await waitFor(() => expect(screen.queryByText('otra.xlsx')).toBeNull());
    expect(screen.getByText('lista.xlsx')).toBeTruthy();
  });

  it('lo que sube la computadora se ve en el celular; uno que no se puede traer queda subiendo', async () => {
    openUploads({ [listPath]: { status: 500, body: { error: 'unexpected' } } });
    await act(() =>
      arrived([{ key: 'u1', fileName: 'pc.xlsx', sent: 30, listId: null }], 'computer'),
    );
    expect(await screen.findByText('Subiendo en la computadora… 30 %')).toBeTruthy();
    await act(() =>
      arrived([{ key: 'u1', fileName: 'pc.xlsx', sent: 60, listId: null }], 'computer'),
    );
    expect(await screen.findByText('Subiendo en la computadora… 60 %')).toBeTruthy();
    await act(() => arrived([{ key: 'u1', fileName: 'pc.xlsx', sent: 100, listId }], 'computer'));
    // Ya se la sigue: lo que llega después de la misma no la vuelve a pedir.
    await act(() => arrived([{ key: 'u1', fileName: 'pc.xlsx', sent: 100, listId }], 'computer'));
    expect(uploads.get()).toMatchObject([{ key: 'computer:u1', listId, phase: 'reading' }]);
  });

  it('lo que sube este viaja al otro, de a 10 %', async () => {
    openUploads();
    const sent: unknown[] = [];
    mirror.attach({ send: (patches) => sent.push(...patches), leader: true, over: 'direct' });
    await act(() => startUploads([sheet('mia.xlsx', 1000)]));
    await waitFor(() => expect(request()?.path).toContain('/api/price-lists/lists?'));
    expect(sent.at(-1)).toMatchObject({
      k: 'price-lists.uploads.computer',
      v: [{ fileName: 'mia.xlsx', sent: 0, listId: null }],
    });
    // Un cambio que no cambia lo que viaja no sale.
    const before = sent.length;
    act(() => uploads.set([...uploads.get()]));
    expect(sent).toHaveLength(before);
    // Con la lista creada, viaja su identificador.
    expect(
      ownOf([
        { key: 'u', fileName: 'f', bytes: 0, sent: 0, scope: 'full', phase: 'reading', listId },
      ]),
    ).toEqual([{ key: 'u', fileName: 'f', sent: 0, listId }]);
  });
});
