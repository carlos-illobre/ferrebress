// Catálogo → Listas (08 · pantalla 1, R1): los proveedores en orden con sus datos, su última lista y lo
// pendiente; los filtros, el buscador, el alta con solo el nombre, los dados de baja, los permisos y
// sin conexión.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { topScreen } from '../../../platform/screens.ts';
import { online } from '../../../platform/server/api.ts';
import { startKeyboard } from '../../../testing/keyboard.ts';
import { toast } from '../../../views/basic/price-lists/readers-kit.tsx';
import {
  addForm,
  inactivePath,
  loaderOnly,
  managerOnly,
  names,
  openSuppliers,
  reactivateOf,
  sellerOnly,
  suppliersPath,
} from '../../../views/basic/price-lists/suppliers-kit.tsx';
import type { Suppliers } from '../model.ts';

const model = () => topScreen()?.model() as Suppliers;
const filter = (name: RegExp) => screen.getByRole('button', { name });

describe('Catálogo → Listas', () => {
  it('price-lists-R1.1 y R1.3: en orden alfabético, con sus datos, su última lista y lo pendiente', async () => {
    openSuppliers();
    await screen.findByText('Ferretera del Sur');
    expect(names()).toEqual(['Álamo Herramientas', 'Bulonera Centro', 'Ferretera del Sur']);
    expect(screen.getByText('3 proveedores')).toBeTruthy();
    expect(screen.getByText('Juan Pérez')).toBeTruthy();
    expect(screen.getByRole('link', { name: '+54 9 11 5555-1234' }).getAttribute('href')).toBe(
      'tel:5491155551234',
    );
    expect(screen.getByRole('link', { name: 'WhatsApp' }).getAttribute('href')).toBe(
      'https://wa.me/5491155551234',
    );
    expect(screen.getByRole('link', { name: 'ventas@sur.com' }).getAttribute('href')).toBe(
      'mailto:ventas%40sur.com',
    );
    expect(screen.getByText('Entrega martes')).toBeTruthy();
    expect(screen.getByText('Última lista: 12/11/2023 · hace 2 días')).toBeTruthy();
    expect(screen.getByText('Última lista: 14/11/2023 · hoy')).toBeTruthy();
    expect(screen.getByText('Sin listas todavía')).toBeTruthy();
    expect(screen.getByText('En espera')).toBeTruthy();
    expect(screen.getByText('Leyéndose')).toBeTruthy();
    expect(screen.getByText('No se pudo leer: Ningún lector entiende esta planilla')).toBeTruthy();
  });

  it('pantalla 1: los en espera y los que no se pudieron leer filtran; tocar de nuevo saca el filtro', async () => {
    openSuppliers();
    await screen.findByText('Ferretera del Sur');
    fireEvent.click(filter(/1 en espera/));
    await waitFor(() => expect(names()).toEqual(['Ferretera del Sur']));
    fireEvent.click(filter(/1 no se pudo leer/));
    await waitFor(() => expect(names()).toEqual(['Bulonera Centro']));
    fireEvent.click(filter(/1 no se pudo leer/));
    await waitFor(() => expect(names()).toHaveLength(3));
  });

  it('price-lists-R1.1: el buscador filtra sin acentos ni mayúsculas; sin ninguno, lo dice', async () => {
    openSuppliers();
    const search = await screen.findByLabelText('Buscar un proveedor');
    fireEvent.input(search, { target: { value: 'ALAMO' } });
    await waitFor(() => expect(names()).toEqual(['Álamo Herramientas']));
    fireEvent.input(search, { target: { value: 'nadie' } });
    expect(await screen.findAllByText('Ningún proveedor con ese nombre.')).not.toHaveLength(0);
  });

  it('un filtro sin ninguno lo dice', async () => {
    openSuppliers({ [suppliersPath]: { body: { suppliers: [{ id: 'x', name: 'Uno' }] } } });
    await screen.findByText('Uno');
    model().toggleFilter('waiting');
    expect(await screen.findAllByText('Ningún proveedor con eso pendiente.')).not.toHaveLength(0);
  });

  it('price-lists-R2.5: los dados de baja, en su filtro, con «Reactivar»', async () => {
    const server = openSuppliers({ [reactivateOf(4)]: { body: { ok: true } } });
    await screen.findByText('Ferretera del Sur');
    fireEvent.click(filter(/Dados de baja/));
    expect(await screen.findByText('Corralón Viejo')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reactivar' }));
    await waitFor(() => expect(toast()).toContain('Corralón Viejo: reactivado'));
    expect(server.sent.map((s) => s.path)).toContain(reactivateOf(4));
  });

  it('sin dados de baja, lo dice; si no se pudo reactivar, también', async () => {
    openSuppliers({
      [inactivePath]: { body: { suppliers: [{ id: 'y', name: 'Viejo' }] } },
      '/api/price-lists/suppliers/y/reactivate': { status: 500, body: { error: 'unexpected' } },
    });
    await screen.findByText('Ferretera del Sur');
    fireEvent.click(filter(/Dados de baja/));
    fireEvent.click(await screen.findByRole('button', { name: 'Reactivar' }));
    await waitFor(() => expect(toast()).toContain('No se pudo guardar'));
  });

  it('price-lists-R1.3: sin «Ver costos», los datos sin listas; sin proveedores, el primer paso según los permisos', async () => {
    openSuppliers({}, sellerOnly);
    await screen.findByText('Ferretera del Sur');
    expect(screen.queryByText(/Última lista/)).toBeNull();
    expect(screen.queryByRole('button', { name: /Dados de baja/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Proveedor nuevo/ })).toBeNull();
  });

  it.each([
    [loaderOnly, /subir la primera lista/],
    [managerOnly, /dar de alta uno/],
    [sellerOnly, /^Todavía no hay proveedores\.$/],
  ])('vacía, dice el primer paso (%#)', async (who, text) => {
    openSuppliers({ [suppliersPath]: { body: { suppliers: [] } } }, who);
    expect(await screen.findAllByText(text)).not.toHaveLength(0);
  });

  it('price-lists-E10 y E94: el alta con solo el nombre; repetido, inválido o dado de baja, lo dice en el lugar', async () => {
    const created = { id: 'n', name: 'Nueva Ferretería', inactive: false };
    // El servidor de mentira contesta por dirección: la lista y las altas comparten la suya.
    const server = openSuppliers({
      [suppliersPath]: [
        { body: { suppliers: [] } },
        { status: 409, body: { error: 'supplier-exists' } },
        { status: 400, body: { error: 'invalid-field', field: 'name' } },
        { status: 500, body: { error: 'unexpected' } },
        { body: created },
        { status: 409, body: { error: 'supplier-inactive', id: 'v' } },
        { body: { suppliers: [created] } },
      ],
      '/api/price-lists/suppliers/v/reactivate': { body: { ok: true } },
    });
    await screen.findAllByText(/Todavía no hay proveedores/);
    fireEvent.click(screen.getByRole('button', { name: /Proveedor nuevo/ }));
    fireEvent.input(screen.getByLabelText('Nombre del proveedor'), {
      target: { value: 'Nueva Ferretería' },
    });
    const create = () => fireEvent.click(screen.getByRole('button', { name: 'Dar de alta' }));
    const said = async (text: string) => {
      create();
      expect(await screen.findByText(text)).toBeTruthy();
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Dar de alta' }).getAttribute('aria-busy')).toBe(
          'false',
        ),
      );
    };
    // Enter en la caja también da de alta.
    fireEvent.submit(addForm());
    expect(await screen.findByText('Ya hay un proveedor con ese nombre.')).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Dar de alta' }).getAttribute('aria-busy')).toBe(
        'false',
      ),
    );
    await said('El nombre va de 1 a 80 letras.');
    await said('No se pudo guardar. Probá de nuevo.');
    create();
    expect(await screen.findByText('Nueva Ferretería')).toBeTruthy();
    expect(toast()).toContain('Nueva Ferretería: dado de alta');
    expect(server.bodies(suppliersPath).at(-1)).toEqual({ name: 'Nueva Ferretería' });
    fireEvent.click(screen.getByRole('button', { name: /Proveedor nuevo/ }));
    fireEvent.input(screen.getByLabelText('Nombre del proveedor'), {
      target: { value: 'Corralón Viejo' },
    });
    create();
    expect(await screen.findByText('Ese proveedor está dado de baja.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reactivar' }));
    await waitFor(() => expect(toast()).toContain('Corralón Viejo: reactivado'));
    expect(screen.queryByLabelText('Nombre del proveedor')).toBeNull();
  });

  it('cancelar el alta la cierra', async () => {
    openSuppliers();
    await screen.findByText('Ferretera del Sur');
    fireEvent.click(screen.getByRole('button', { name: /Proveedor nuevo/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByLabelText('Nombre del proveedor')).toBeNull();
    await model().create();
  });

  it('si no se pudieron traer, lo dice y reintenta', async () => {
    openSuppliers({
      [suppliersPath]: [
        { status: 500, body: { error: 'unexpected' } },
        { body: { suppliers: [] } },
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findAllByText(/Todavía no hay proveedores/)).not.toHaveLength(0);
  });
});

describe('Catálogo → Listas con el teclado y sin conexión', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => stop());

  it('Alt N abre el alta de un proveedor', async () => {
    openSuppliers();
    await screen.findByText('Ferretera del Sur');
    fireEvent.keyDown(window, { key: 'N', code: 'KeyN', altKey: true });
    expect(await screen.findByLabelText('Nombre del proveedor')).toBeTruthy();
  });

  it('price-lists-E07: sin conexión, gris lo último que se vio, sin alta, y Alt R reintenta', async () => {
    const server = openSuppliers();
    await screen.findByText('Ferretera del Sur');
    online.set(false);
    expect(await screen.findByText(/Sin conexión: es lo último que se vio/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Proveedor nuevo/ })).toBeNull();
    const asked = () => server.sent.filter((s) => s.path === suppliersPath).length;
    const before = asked();
    online.set(true);
    fireEvent.keyDown(window, { key: 'R', code: 'KeyR', altKey: true });
    await waitFor(() => expect(asked()).toBeGreaterThan(before));
  });
});
