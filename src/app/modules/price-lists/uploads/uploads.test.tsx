// Subir una lista (08 · pantalla 2, R4): lo que se rechaza antes de subir, el avance de la subida y de
// la lectura, de quién es, si es completa, una planilla muy grande, cancelar y lo que no se pudo.
import { act, fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bulonera,
  listPath,
  MB,
  openUploads,
  request,
  sheet,
  state,
  supplierId,
} from '../../../views/basic/price-lists/uploads/kit.tsx';
import { startUploads } from './actions.ts';
import type { Upload } from './rules.ts';
import { uploads } from './store.ts';

const button = (name: string | RegExp) => screen.getByRole('button', { name });
// Contesta la subida y espera a que la lista se escuche por su tema.
const answered = async (listening: () => boolean, body = state()) => {
  act(() => request().answer(201, body));
  await waitFor(() => expect(listening()).toBe(true));
};
const sending = async (file = sheet()) => {
  await act(() => startUploads([file]));
  await waitFor(() => expect(request()?.path).toContain('/api/price-lists/lists?'));
};

describe('subir una lista', () => {
  afterEach(() => {
    uploads.set([]);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('price-lists-R4.2: lo que no es planilla o pasa el tamaño se rechaza sin subirlo', async () => {
    const { server } = openUploads();
    await act(() => startUploads([sheet('foto.png'), sheet('grande.csv', 2 * MB)]));
    expect(
      await screen.findByText('foto.png: no es una planilla de Excel ni un CSV.'),
    ).toBeTruthy();
    expect(screen.getByText('grande.csv: pasa el tamaño máximo de 1 MB.')).toBeTruthy();
    expect(server.sent.some((s) => s.path.startsWith('/api/price-lists/lists'))).toBe(false);
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' })[0] as HTMLElement);
    expect(screen.queryByText('foto.png')).toBeNull();
  });

  it('price-lists-R4.9 y R4.3: el avance de la subida y de la lectura; sin proveedor, se elige', async () => {
    const { topic, server, listening } = openUploads({
      [listPath]: { body: state({ waitingFor: 'supplier', rowsRead: 10_000 }) },
      [`${listPath}/supplier`]: { body: state({ ...bulonera('chosen'), rowsRead: 10_000 }) },
    });
    // Otra que se rechazó queda en el panel sin cambiar.
    await act(() => startUploads([sheet('foto.png')]));
    await sending();
    act(() => request().upload.onprogress?.({ loaded: 500, total: 1000 }));
    expect(await screen.findByText('Subiendo… 50 %')).toBeTruthy();
    await answered(listening);
    act(() => topic({ status: 'reading', rowsRead: 5000, rowsTotal: 10_000 }));
    expect(await screen.findByText('Leyendo: 5.000 de 10.000 filas')).toBeTruthy();
    act(() => topic({ status: 'reading', rowsRead: 10_000, waitingFor: 'supplier' }));
    expect(await screen.findByText('¿De qué proveedor es?')).toBeTruthy();
    fireEvent.input(screen.getByLabelText('Buscar el proveedor'), { target: { value: 'bulo' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Bulonera Centro' }));
    expect(await screen.findByText('De Bulonera Centro')).toBeTruthy();
    expect(server.bodies(`${listPath}/supplier`)).toEqual([{ supplierId }]);
    // Más filas, con el proveedor sabido: no se vuelve a pedir el estado.
    const asked = server.sent.filter((s) => s.path === listPath).length;
    act(() => topic({ status: 'reading', rowsRead: 10_000 }));
    expect(server.sent.filter((s) => s.path === listPath)).toHaveLength(asked);
    act(() => topic({ status: 'pending', rowsRead: 10_000 }));
    expect(await screen.findByText('Leída: 10.000 filas')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar' })[1] as HTMLElement);
    expect(screen.queryByText('lista.xlsx')).toBeNull();
  });

  it('price-lists-R4.3: deducido por el nombre se pregunta; «Sí» lo confirma y «No» deja elegir o dar de alta', async () => {
    const { topic, server, listening } = openUploads({
      [listPath]: { body: state(bulonera('name')) },
      [`${listPath}/supplier`]: [
        { body: state(bulonera('name', true)) },
        { status: 409, body: { error: 'supplier-exists' } },
        { status: 409, body: { error: 'supplier-exists' } },
        { status: 409, body: { error: 'supplier-inactive', id: 'x' } },
        { status: 400, body: { error: 'invalid-field', field: 'name' } },
        { status: 500, body: { error: 'unexpected' } },
        { body: state(bulonera('chosen')) },
      ],
    });
    await sending();
    await answered(listening);
    act(() => topic({ status: 'reading', rowsRead: 1 }));
    fireEvent.click(await screen.findByRole('button', { name: 'Sí' }));
    expect(await screen.findByText('De Bulonera Centro')).toBeTruthy();
    fireEvent.click(button('Cambiar'));
    // Sin escribir el nombre, va vacío: el servidor dice que ya existe (la respuesta de la prueba).
    fireEvent.click(button('Dar de alta y usar'));
    expect(await screen.findByText('Ya hay un proveedor con ese nombre.')).toBeTruthy();
    const name = screen.getByLabelText('Nombre del proveedor nuevo');
    fireEvent.input(name, { target: { value: 'Nueva' } });
    for (const said of [
      'Ya hay un proveedor con ese nombre.',
      'Ese proveedor está dado de baja: reactivalo desde Listas.',
      'El nombre va de 1 a 80 letras.',
      'No se pudo guardar. Probá de nuevo.',
    ]) {
      fireEvent.click(button('Dar de alta y usar'));
      expect(await screen.findByText(said)).toBeTruthy();
    }
    fireEvent.click(button('Dar de alta y usar'));
    expect(await screen.findByText('De Bulonera Centro')).toBeTruthy();
    expect(server.bodies(`${listPath}/supplier`).at(-1)).toEqual({
      newSupplier: { name: 'Nueva' },
    });
  });

  it('«No, es de otro» deja elegir', async () => {
    const { topic, listening } = openUploads({ [listPath]: { body: state(bulonera('name')) } });
    await sending();
    await answered(listening);
    act(() => topic({ status: 'reading', rowsRead: 1 }));
    fireEvent.click(await screen.findByRole('button', { name: 'No, es de otro' }));
    expect(await screen.findByText('¿De qué proveedor es?')).toBeTruthy();
  });

  it('price-lists-R4.12: una planilla muy grande pregunta antes de leerla; «Leer igual» sigue', async () => {
    const { topic, server, listening } = openUploads({
      [listPath]: { body: state({ waitingFor: 'size', rowsTotal: 300_000 }) },
      [`${listPath}/size`]: { body: state({ rowsTotal: 300_000 }) },
    });
    await sending();
    await answered(listening);
    act(() => topic({ status: 'reading', rowsRead: 0, waitingFor: 'size', rowsTotal: 300_000 }));
    expect(await screen.findAllByText(/300\.000 filas/)).not.toHaveLength(0);
    fireEvent.click(button('Leer igual'));
    await waitFor(() => expect(server.bodies(`${listPath}/size`)).toHaveLength(1));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Leer igual' })).toBeNull());
  });

  it('price-lists-R4.7: completa o solo cambios, también mientras sube; si no se pudo, lo dice', async () => {
    const { server } = openUploads({
      [`${listPath}/scope`]: [
        { body: state({ scope: 'partial' }) },
        { status: 500, body: { error: 'unexpected' } },
      ],
    });
    await sending();
    fireEvent.click(screen.getByLabelText('Solo cambios'));
    expect(await screen.findByText('Una lista de solo cambios no da de baja nada.')).toBeTruthy();
    act(() => request().answer(201, state()));
    await waitFor(() => expect(server.bodies(`${listPath}/scope`)).toEqual([{ scope: 'partial' }]));
    fireEvent.click(screen.getByLabelText('Lista completa'));
    expect(await screen.findByText('No se pudo guardar. Probá de nuevo.')).toBeTruthy();
  });

  it('price-lists-R4.11: cancelar mientras sube no deja nada; mientras lee, la descarta', async () => {
    const { server, listening } = openUploads({
      [`${listPath}/cancel`]: { body: state({ status: 'discarded', reason: 'cancelled' }) },
    });
    await sending();
    fireEvent.click(button('Cancelar'));
    expect(await screen.findByText('Cancelada')).toBeTruthy();
    fireEvent.click(button('Cerrar'));
    await sending(sheet('otra.csv'));
    await answered(listening);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(server.bodies(`${listPath}/cancel`)).toEqual([{}]));
    expect(listening()).toBe(false);
  });

  it('price-lists-R4.2: si el servidor no la acepta o no hay conexión, lo dice', async () => {
    openUploads();
    for (const [status, body, said] of [
      [413, { error: 'file-too-large', maxMb: 30 }, 'lista.xlsx: pasa el tamaño máximo de 30 MB.'],
      [415, { error: 'file-format' }, 'lista.xlsx: no es una planilla de Excel ni un CSV.'],
      [500, { error: 'unexpected' }, 'No se pudo subir. Probá de nuevo.'],
    ] as const) {
      await sending();
      act(() => request().answer(status, body));
      expect(await screen.findByText(said)).toBeTruthy();
      act(() => uploads.set([]));
    }
  });

  it('price-lists-R4.6, R4.8: no se pudo leer, se descartó, espera su turno o reemplaza la que estaba en espera', async () => {
    const { topic, listening } = openUploads({
      [listPath]: { body: state(bulonera('reader')) },
      '/api/price-lists/suppliers': {
        body: {
          suppliers: [
            {
              id: supplierId,
              name: 'Bulonera Centro',
              pending: { listId: 'otra', status: 'pending' },
            },
          ],
        },
      },
    });
    await sending();
    await answered(listening, state({ status: 'queued' }));
    expect(await screen.findByText('Esperando su turno para leerse')).toBeTruthy();
    act(() => topic({ status: 'reading', rowsRead: 10 }));
    expect(
      await screen.findByText('Reemplaza la lista de este proveedor que estaba en espera.'),
    ).toBeTruthy();
    act(() => topic({ status: 'unreadable', rowsRead: 10, reason: 'damaged' }));
    expect(await screen.findAllByText(/No se pudo leer: El archivo está dañado/)).not.toHaveLength(
      0,
    );
    act(() =>
      uploads.set([
        {
          ...(uploads.get()[0] as Upload),
          phase: 'reading',
          progress: { status: 'discarded', rowsRead: 0 },
        },
      ]),
    );
    expect(await screen.findByText('Se descartó.')).toBeTruthy();
    // Sin motivo, se dice el de siempre: ningún lector la entiende.
    act(() =>
      uploads.set([
        {
          ...(uploads.get()[0] as Upload),
          progress: { status: 'unreadable', rowsRead: 0 },
        },
      ]),
    );
    expect(await screen.findAllByText(/Ningún lector entiende/)).not.toHaveLength(0);
  });
});
