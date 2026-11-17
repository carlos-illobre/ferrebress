// Subir una lista desde Catálogo → Listas (08 · pantalla 1, R4.3): con «Subir lista» (o Alt S), desde
// el renglón de un proveedor (sin preguntar de quién es) o soltando el archivo sobre la pantalla.
import { act, fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeRequest } from '../../../testing/fake-request.ts';
import { startKeyboard } from '../../../testing/keyboard.ts';
import {
  fileBoxes,
  id,
  openSuppliers,
  screenRoot,
  sellerOnly,
} from '../../../views/basic/price-lists/suppliers-kit.tsx';
import { request, sheet } from '../../../views/basic/price-lists/uploads/kit.tsx';
import { uploads } from './store.ts';

const choose = (box: HTMLInputElement, files: File[]) => {
  Object.defineProperty(box, 'files', { value: files, configurable: true });
  fireEvent.change(box);
};
const sentTo = () => request()?.path ?? '';

describe('subir desde Catálogo → Listas', () => {
  afterEach(() => {
    uploads.set([]);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('price-lists-R4.3: «Subir lista» no dice de quién es; desde un proveedor, sí', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeRequest);
    openSuppliers({ '/api/administration': { status: 500, body: { error: 'unexpected' } } });
    await screen.findByText('Ferretera del Sur');
    choose(fileBoxes()[0] as HTMLInputElement, [sheet('a.xlsx')]);
    await waitFor(() => expect(sentTo()).toContain('name=a.xlsx'));
    expect(sentTo()).not.toContain('supplierId');
    choose(fileBoxes()[3] as HTMLInputElement, [sheet('b.xlsx')]);
    await waitFor(() => expect(sentTo()).toContain(`supplierId=${id(1)}`));
  });

  it('soltar el archivo sobre la pantalla lo sube; sin «Cargar listas», no', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeRequest);
    openSuppliers({ '/api/administration': { status: 500, body: { error: 'unexpected' } } });
    await screen.findByText('Ferretera del Sur');
    fireEvent.dragOver(screenRoot());
    fireEvent.drop(screenRoot(), { dataTransfer: { files: [sheet('c.csv')] } });
    await waitFor(() => expect(sentTo()).toContain('name=c.csv'));
    // Algo que no trae archivos no sube nada.
    const before = uploads.get().length;
    fireEvent.drop(screenRoot());
    await act(async () => {});
    expect(uploads.get()).toHaveLength(before);
  });

  it('sin «Cargar listas», ni el botón ni soltar suben nada', async () => {
    openSuppliers({}, sellerOnly);
    await screen.findByText('Ferretera del Sur');
    expect(fileBoxes()).toHaveLength(0);
    fireEvent.dragOver(screenRoot());
    fireEvent.drop(screenRoot(), { dataTransfer: { files: [sheet('c.csv')] } });
    expect(uploads.get()).toEqual([]);
  });

  it('Alt S abre la elección del archivo', async () => {
    const stop = startKeyboard();
    openSuppliers();
    await screen.findByText('Ferretera del Sur');
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    act(() => {
      fireEvent.keyDown(window, { key: 'S', code: 'KeyS', altKey: true });
    });
    await waitFor(() => expect(clicked).toHaveBeenCalled());
    fireEvent.click(screen.getAllByRole('button', { name: /Subir lista/ })[0] as HTMLElement);
    expect(clicked).toHaveBeenCalledTimes(2);
    stop();
  });
});
