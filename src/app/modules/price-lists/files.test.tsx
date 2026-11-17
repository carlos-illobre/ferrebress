// Archivos de listas (06 · pantalla 3, R10): cuánto ocupan, cada archivo con sus listas, bajarlo,
// borrarlo con «Deshacer», el que no se puede borrar, los permisos, sin conexión y vacía.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { navigate, route } from '../../platform/router.ts';
import { topScreen } from '../../platform/screens.ts';
import { online } from '../../platform/server/api.ts';
import { startKeyboard } from '../../testing/keyboard.ts';
import {
  costsOnly,
  file,
  fileOf,
  filesPath,
  MB,
  meta,
  openFiles,
  page,
  removeOf,
  restoreOf,
  seller,
} from '../../views/basic/price-lists/files-kit.tsx';
import { toast } from '../../views/basic/price-lists/readers-kit.tsx';
import { type ListFiles, megabytes } from './model.ts';

const model = () => topScreen()?.model() as ListFiles;
const disposition = `attachment; filename="lista-1.xlsx"; filename*=UTF-8''lista%20%C3%B1.xlsx`;

describe('Archivos de listas', () => {
  afterEach(() => vi.restoreAllMocks());

  it('administration-E55 y R10.1: cuánto ocupan contra el espacio, y cada archivo con su lista, proveedor y estado', async () => {
    openFiles();
    expect(await screen.findByText('80 MB de 100 MB')).toBeTruthy();
    expect(screen.getByText('Bulonera')).toBeTruthy();
    expect(screen.getByText('lista-1.xlsx')).toBeTruthy();
    expect(screen.getByText('Aplicada')).toBeTruthy();
    expect(screen.getByText('Sin proveedor todavía')).toBeTruthy();
    expect(screen.getByText('Leyéndose')).toBeTruthy();
    expect(meta()).toBe('Subido hace 2 horas · 3 MB');
    expect(screen.getByText(/0,4 MB/)).toBeTruthy();
  });

  it('administration-E54: el de una lista que se lee no se borra, y dice por qué', async () => {
    openFiles();
    await screen.findByText('Leyéndose');
    expect(screen.getAllByRole('button', { name: 'Borrar' })).toHaveLength(1);
    expect(
      screen.getByText('Su lista se está leyendo o aplicando: no se puede borrar ahora.'),
    ).toBeTruthy();
  });

  it('administration-E53: borrar uno lo saca, con «Deshacer», que lo trae de vuelta', async () => {
    const server = openFiles({ [removeOf(1)]: { body: { ok: true } }, [restoreOf(1)]: {} });
    fireEvent.click(await screen.findByRole('button', { name: 'Borrar' }));
    await waitFor(() => expect(screen.queryByText('lista-1.xlsx')).toBeNull());
    expect(toast()).toContain('Archivo borrado');
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(await screen.findByText('lista-1.xlsx')).toBeTruthy();
    expect(toast()).toContain('El archivo volvió');
    expect(server.sent.map((s) => s.path)).toContain(restoreOf(1));
  });

  it('si el servidor no deja borrar o no puede deshacer, lo dice', async () => {
    openFiles({
      [removeOf(1)]: [
        { status: 409, body: { error: 'file-in-use' } },
        { status: 500, body: { error: 'unexpected' } },
        { body: { ok: true } },
      ],
      [restoreOf(1)]: { status: 500, body: { error: 'unexpected' } },
    });
    const remove = await screen.findByRole('button', { name: 'Borrar' });
    fireEvent.click(remove);
    await waitFor(() => expect(toast()).toContain('no se puede borrar ahora'));
    fireEvent.click(remove);
    await waitFor(() => expect(toast()).toContain('No se pudo borrar'));
    fireEvent.click(remove);
    fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(toast()).toContain('No se pudo borrar'));
    expect(screen.queryByText('lista-1.xlsx')).toBeNull();
  });

  it('borrar desde el modelo uno que está en uso no llega al servidor', async () => {
    const server = openFiles();
    await screen.findByText('Leyéndose');
    await model().remove(page.files[1] as never);
    expect(toast()).toContain('no se puede borrar ahora');
    expect(server.sent.some((s) => s.path.endsWith('/delete'))).toBe(false);
  });

  it('price-lists-E40: bajar uno lo guarda con su nombre original', async () => {
    const saved: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      saved.push(this.download);
    });
    openFiles({
      [fileOf('l1')]: { stream: 'datos', headers: { 'Content-Disposition': disposition } },
    });
    fireEvent.click((await screen.findAllByRole('button', { name: 'Bajar' }))[0] as HTMLElement);
    await waitFor(() => expect(saved).toEqual(['lista ñ.xlsx']));
  });

  it('si el archivo ya no está, hay dos bajando o falla, lo dice', async () => {
    openFiles({
      [fileOf('l1')]: [
        { status: 410, body: { error: 'file-gone' } },
        { status: 429, body: { error: 'too-many-downloads' } },
        { status: 500, body: { error: 'unexpected' } },
      ],
    });
    const download = (await screen.findAllByRole('button', { name: 'Bajar' }))[0] as HTMLElement;
    fireEvent.click(download);
    await waitFor(() => expect(toast()).toContain('ya no se guarda'));
    fireEvent.click(download);
    await waitFor(() => expect(toast()).toContain('dos archivos'));
    fireEvent.click(download);
    await waitFor(() => expect(toast()).toContain('No se pudo bajar'));
  });

  it('un archivo sin listas no tiene qué bajar', async () => {
    const server = openFiles();
    await screen.findByText('Leyéndose');
    await model().download(file(9, { lists: [] }));
    expect(server.sent.some((s) => s.path.endsWith('/file'))).toBe(false);
  });

  it('administration-R10.2: sin «Cambiar los ajustes», se ve y se baja, pero no se borra', async () => {
    openFiles({}, costsOnly);
    expect(
      await screen.findByText('Para borrar un archivo hace falta «Cambiar los ajustes».'),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Borrar' })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Bajar' })).toHaveLength(2);
  });

  it('administration-R10.3: sin «Ver costos», dice qué falta', async () => {
    openFiles({}, seller);
    expect(
      await screen.findByText('Para ver los archivos de las listas hace falta «Ver costos».'),
    ).toBeTruthy();
  });

  it('vacía, dice que no hay archivos', async () => {
    openFiles({ [filesPath]: { body: { ...page, files: [], totalBytes: 0 } } });
    expect(await screen.findByText('No hay archivos guardados.')).toBeTruthy();
    expect(screen.getByText('0 MB de 100 MB')).toBeTruthy();
  });

  it('con más de una página, «Ver más» trae la siguiente; si falla, lo dice', async () => {
    const after = `${filesPath}?after=123_${'a'.repeat(64)}`;
    openFiles({
      [filesPath]: { body: { ...page, next: `123_${'a'.repeat(64)}` } },
      [after]: [
        { status: 500, body: { error: 'unexpected' } },
        { body: { ...page, files: [file(3)] } },
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Ver más' }));
    await waitFor(() => expect(toast()).toContain('No se pudieron traer'));
    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }));
    expect(await screen.findByText('lista-3.xlsx')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ver más' })).toBeNull();
    await model().more();
  });

  it('si no se pudo traer, lo dice y reintenta', async () => {
    openFiles({ [filesPath]: [{ status: 500, body: { error: 'unexpected' } }, { body: page }] });
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('lista-1.xlsx')).toBeTruthy();
  });

  it('volver lleva a los ajustes de Administración', async () => {
    navigate('/administration/files');
    openFiles();
    await screen.findByText('lista-1.xlsx');
    model().back();
    expect(route.get().path).toBe('/administration');
  });

  it('el tamaño, en MB, con una cifra decimal debajo de 10', () => {
    expect(megabytes(0)).toBe('0 MB');
    expect(megabytes(1.25 * MB)).toBe('1,3 MB');
    expect(megabytes(12.6 * MB)).toBe('13 MB');
  });
});

describe('Archivos de listas con el teclado y sin conexión', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => stop());

  it('administration-R10.2: Alt B borra el archivo elegido, y muestra su tecla', async () => {
    const server = openFiles({ [removeOf(1)]: { body: { ok: true } } });
    const remove = await screen.findByRole('button', { name: 'Borrar' });
    fireEvent.keyDown(window, { key: 'B', code: 'KeyB', altKey: true });
    expect(server.sent.some((s) => s.path === removeOf(1))).toBe(false);
    fireEvent.focus(remove);
    await waitFor(() => expect(remove.textContent).toContain('B'));
    fireEvent.keyDown(window, { key: 'B', code: 'KeyB', altKey: true });
    await waitFor(() => expect(server.sent.some((s) => s.path === removeOf(1))).toBe(true));
  });

  it('sin conexión se ve gris lo último que se vio, sin bajar ni borrar, y Alt R reintenta', async () => {
    const server = openFiles();
    await screen.findByText('lista-1.xlsx');
    online.set(false);
    expect(await screen.findByText(/Sin conexión: es lo último que se vio/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Bajar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Borrar' })).toBeNull();
    const asked = () => server.sent.filter((s) => s.path === filesPath).length;
    const before = asked();
    online.set(true);
    fireEvent.keyDown(window, { key: 'R', code: 'KeyR', altKey: true });
    await waitFor(() => expect(asked()).toBeGreaterThan(before));
  });
});
