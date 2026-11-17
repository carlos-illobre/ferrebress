// Las listas y los productos de un proveedor (08 · R6.7, R8): las listas con su estado y quién las
// subió y decidió, la que espera lleva a ver qué cambia; los productos de a 50, con buscador, los dados
// de baja aparte con desde cuándo, cada costo con su cuenta. Con el teclado: una tecla por parte y
// subir una lista suya.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { navigate, route } from '../../../platform/router.ts';
import { online } from '../../../platform/server/api.ts';
import { FakeRequest } from '../../../testing/fake-request.ts';
import { startKeyboard } from '../../../testing/keyboard.ts';
import { toast } from '../../../views/basic/price-lists/readers-kit.tsx';
import {
  item,
  itemsPath,
  openSupplier,
  pendingId,
  supplierId,
  supplierPath,
} from '../../../views/basic/price-lists/supplier/kit.tsx';
import { fileBoxes } from '../../../views/basic/price-lists/suppliers-kit.tsx';
import { request, sheet } from '../../../views/basic/price-lists/uploads/kit.tsx';
import { uploads } from '../uploads/store.ts';

const tab = (name: RegExp) => fireEvent.click(screen.getByRole('tab', { name }));

describe('un proveedor: listas y productos', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    navigate('/', { replace: true });
  });

  it('price-lists-R6.7: sus listas con estado, quién y cuándo; la que espera abre ver qué cambia', async () => {
    openSupplier({
      [`${supplierPath}/lists?after=n1`]: [
        { status: 500, body: { error: 'unexpected' } },
        {
          body: {
            lists: [
              {
                id: 'z',
                status: 'unreadable',
                fileName: 'z.csv',
                uploadedAt: '2023-08-01T12:00:00Z',
                reason: 'damaged',
                file: false,
              },
            ],
          },
        },
      ],
    });
    await screen.findByRole('heading', { name: 'Bulonera Centro' });
    tab(/^Listas/);
    expect(await screen.findByText('Lista del 10/11/2023')).toBeTruthy();
    expect(screen.getByText('La subió Rubén hace 1 hora')).toBeTruthy();
    expect(screen.getByText(/La aplicó Marta/)).toBeTruthy();
    expect(screen.getByText(/La descartó alguien/)).toBeTruthy();
    expect(screen.getByText('Descartada · Se descartó a mano')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }));
    await waitFor(() => expect(toast()).toContain('No se pudo guardar'));
    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }));
    expect(
      await screen.findByText('No se pudo leer · El archivo está dañado o no es una planilla'),
    ).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ver más' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Ver qué cambia' }));
    expect(route.get().path).toBe(`/catalog/lists/${pendingId}`);
  });

  it('price-lists-R8.1 y R8.2: los productos con su cuenta; los dados de baja aparte, con desde cuándo', async () => {
    const server = openSupplier({
      [itemsPath('discontinued=false')]: {
        body: { items: [item('A1', { brand: 'Bremen' })], next: 'x' },
      },
      [itemsPath('discontinued=false&after=x')]: [
        { status: 500, body: { error: 'unexpected' } },
        { body: { items: [item('A2')] } },
      ],
      [itemsPath('discontinued=true')]: {
        body: {
          items: [
            item('B1', { discontinued: true, goneSince: { listId: 'l', listDate: '2023-10-01' } }),
            item('B2', { discontinued: true, goneSince: {} }),
            item('B3', { discontinued: true, goneSince: { listId: 'l' } }),
          ],
        },
      },
      [itemsPath('q=nada&discontinued=true')]: { body: { items: [] } },
    });
    await screen.findByRole('heading', { name: 'Bulonera Centro' });
    tab(/Productos/);
    expect(await screen.findByText('Artículo A1')).toBeTruthy();
    expect(screen.getByText('$ 750,00')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ver la cuenta' }));
    expect(screen.getByText('General (25 %): $ 750,00')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar la cuenta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }));
    await waitFor(() => expect(toast()).toContain('No se pudo guardar'));
    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }));
    expect(await screen.findByText('Artículo A2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dados de baja' }));
    expect(await screen.findByText('Dejó de venir con la lista del 01/10/2023')).toBeTruthy();
    expect(screen.getByText('Se dio de baja con el proveedor')).toBeTruthy();
    expect(screen.getByText('Dejó de venir con la lista del Sin fecha')).toBeTruthy();
    fireEvent.input(screen.getByLabelText('Buscar por código, descripción o marca'), {
      target: { value: 'nada' },
    });
    expect(await screen.findByText('Ningún producto con eso.')).toBeTruthy();
    expect(server.sent.map((s) => s.path)).toContain(itemsPath('q=nada&discontinued=true'));
    fireEvent.click(screen.getByRole('button', { name: 'Los que vienen' }));
  });

  it('sin listas, lo dice', async () => {
    openSupplier({
      [supplierPath]: {
        body: {
          id: supplierId,
          name: 'Nuevo',
          inactive: false,
          terms: {
            value: { vatIncluded: false, discounts: [], defaultVat: 210, onChange: 'next' },
            version: 1,
          },
          lists: { lists: [] },
        },
      },
    });
    await screen.findByRole('heading', { name: 'Nuevo' });
    tab(/^Listas/);
    expect(await screen.findByText('Todavía no tiene listas.')).toBeTruthy();
  });
});

describe('un proveedor con el teclado y sin conexión', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => {
    stop();
    uploads.set([]);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('Alt 1 a 4 eligen la parte; Alt S y «Subir lista» suben una lista suya', async () => {
    vi.stubGlobal('XMLHttpRequest', FakeRequest);
    openSupplier({ '/api/administration': { status: 500, body: { error: 'unexpected' } } });
    await screen.findByRole('heading', { name: 'Bulonera Centro' });
    for (const [key, shown] of [
      ['4', 'Artículo A1'],
      ['3', 'Lista del 10/11/2023'],
      ['2', 'Descuentos, en orden'],
      ['1', 'Vendedor'],
    ] as const) {
      fireEvent.keyDown(window, { key, code: `Digit${key}`, altKey: true });
      expect(await screen.findAllByText(shown)).not.toHaveLength(0);
    }
    const clicked = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    fireEvent.keyDown(window, { key: 'S', code: 'KeyS', altKey: true });
    await waitFor(() => expect(clicked).toHaveBeenCalled());
    const box = fileBoxes()[0] as HTMLInputElement;
    Object.defineProperty(box, 'files', { value: [sheet('b.xlsx')], configurable: true });
    fireEvent.change(box);
    await waitFor(() => expect(request()?.path).toContain(`supplierId=${supplierId}`));
  });

  it('sin conexión, gris lo último que se vio, sin cambiar, y Alt R reintenta', async () => {
    const server = openSupplier();
    await screen.findByRole('heading', { name: 'Bulonera Centro' });
    online.set(false);
    expect(await screen.findByText(/Sin conexión: es lo último que se vio/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Dar de baja el proveedor' })).toBeNull();
    const asked = () => server.sent.filter((s) => s.path === supplierPath).length;
    const before = asked();
    online.set(true);
    fireEvent.keyDown(window, { key: 'R', code: 'KeyR', altKey: true });
    await waitFor(() => expect(asked()).toBeGreaterThan(before));
  });
});
