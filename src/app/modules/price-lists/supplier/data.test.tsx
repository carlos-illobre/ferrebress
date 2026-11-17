// La pantalla de un proveedor, sus datos y su estado (08 · pantalla 4, R1.7, R2): cada dato se guarda
// al cambiarlo con «Deshacer»; lo que no vale, lo repetido o lo que cambió otro se dice en el lugar;
// dar de baja se confirma con sus números; un dado de baja se reactiva; sin permisos, se lee.
import { act, fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate, route } from '../../../platform/router.ts';
import { topScreen } from '../../../platform/screens.ts';
import { toast } from '../../../views/basic/price-lists/readers-kit.tsx';
import {
  openSupplier,
  supplier,
  supplierPath,
} from '../../../views/basic/price-lists/supplier/kit.tsx';
import { sellerOnly } from '../../../views/basic/price-lists/suppliers-kit.tsx';
import type { Supplier } from './supplier.ts';

const box = (name: string) => screen.getByLabelText(name) as HTMLInputElement;
const type = (name: string, value: string) => {
  const input = box(name);
  input.value = value;
  fireEvent.focusOut(input);
};
const busy = async (name: string | RegExp) => {
  const button = screen.getByRole('button', { name });
  await waitFor(() => expect(button.getAttribute('aria-busy')).toBe('false'));
  return button;
};

describe('un proveedor: sus datos', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    navigate('/', { replace: true });
  });

  it('price-lists-R2.1 y R1.7: cada dato se guarda al cambiarlo, con lo que se vio, y «Deshacer» lo vuelve', async () => {
    const server = openSupplier({
      [supplierPath]: [
        { body: supplier() },
        { body: supplier({ seller: 'Ana Ruiz' }) },
        { body: supplier() },
      ],
    });
    expect(await screen.findByRole('heading', { name: 'Bulonera Centro' })).toBeTruthy();
    type('Vendedor', 'Ana Ruiz');
    await waitFor(() => expect(toast()).toContain('Vendedor: guardado'));
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() =>
      expect(server.bodies(supplierPath)).toEqual([
        undefined,
        { field: 'seller', before: 'Juan Pérez', value: 'Ana Ruiz' },
        { field: 'seller', before: 'Ana Ruiz', value: 'Juan Pérez' },
      ]),
    );
  });

  it('«Deshacer» de un dato que estaba vacío lo vuelve a dejar vacío', async () => {
    const server = openSupplier({
      [supplierPath]: [
        { body: supplier() },
        { body: supplier({ email: 'a@b.com' }) },
        { body: supplier() },
      ],
    });
    await screen.findByRole('heading', { name: 'Bulonera Centro' });
    type('Correo', 'a@b.com');
    await waitFor(() => expect(toast()).toContain('Correo: guardado'));
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() =>
      expect(server.bodies(supplierPath).at(-1)).toEqual({
        field: 'email',
        before: 'a@b.com',
        value: null,
      }),
    );
  });

  it('price-lists-R1.7, E10: lo que no vale, un nombre repetido o lo que cambió otro, se dice en el lugar', async () => {
    openSupplier({
      [supplierPath]: [
        { body: supplier() },
        { status: 409, body: { error: 'supplier-exists' } },
        { status: 409, body: { error: 'field-changed', value: 'Otro Vendedor' } },
        { status: 409, body: { error: 'field-changed', value: null } },
        { status: 500, body: { error: 'unexpected' } },
      ],
    });
    await screen.findByRole('heading', { name: 'Bulonera Centro' });
    type('Correo', 'no-es-correo');
    expect(await screen.findByText('No parece un correo.')).toBeTruthy();
    type('Nombre', '');
    expect(await screen.findByText('El nombre va de 1 a 80 letras.')).toBeTruthy();
    type('Nota', 'x'.repeat(501));
    expect(await screen.findByText('Es demasiado largo.')).toBeTruthy();
    type('Nombre', 'Ferretera del Sur');
    expect(await screen.findByText('Ya hay un proveedor con ese nombre.')).toBeTruthy();
    type('Vendedor', 'Ana');
    expect(
      await screen.findByText('Lo cambió otra persona recién: ahora dice «Otro Vendedor».'),
    ).toBeTruthy();
    type('Teléfono o WhatsApp', '123');
    expect(
      await screen.findByText('Lo cambió otra persona recién: ahora dice «vacío».'),
    ).toBeTruthy();
    type('Teléfono o WhatsApp', '456');
    expect(await screen.findByText('No se pudo guardar. Probá de nuevo.')).toBeTruthy();
    // Sin cambio, no se manda nada.
    type('Nombre', 'Bulonera Centro');
  });

  it('price-lists-R1.3: sin permisos, los datos se leen y no hay más partes ni acciones', async () => {
    openSupplier({}, sellerOnly);
    await screen.findByRole('heading', { name: 'Bulonera Centro' });
    expect(box('Vendedor').readOnly).toBe(true);
    expect(screen.queryByRole('tab', { name: /Cómo cobra/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Dar de baja el proveedor' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Subir lista' })).toBeNull();
    // Una parte que pide más permisos (la del otro dispositivo) no se muestra: siguen los datos.
    act(() => (topScreen()?.model() as Supplier | undefined)?.choose('terms'));
    expect(screen.queryByText('Descuentos, en orden')).toBeNull();
    expect(box('Vendedor')).toBeTruthy();
  });

  it('volver lleva a Listas; si no se pudo traer, lo dice y reintenta', async () => {
    openSupplier({
      [supplierPath]: [{ status: 500, body: { error: 'unexpected' } }, { body: supplier() }],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    fireEvent.click(await screen.findByRole('button', { name: /Listas/ }));
    expect(route.get().path).toBe('/catalog');
  });
});

describe('un proveedor: dar de baja y reactivar', () => {
  afterEach(() => vi.restoreAllMocks());

  it('price-lists-R2.4 y E12: dar de baja se confirma con sus números, y queda dado de baja', async () => {
    const deactivate = `${supplierPath}/deactivate`;
    const server = openSupplier({
      [supplierPath]: [{ body: supplier() }, { body: supplier({ inactive: true }) }],
      [deactivate]: [
        { status: 409, body: { error: 'confirm-deactivate', costs: 12, discontinued: 3 } },
        { status: 409, body: { error: 'confirm-deactivate', costs: 12, discontinued: 3 } },
        { body: { ok: true, costs: 12, discontinued: 3 } },
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Dar de baja el proveedor' }));
    expect(await screen.findAllByText(/12 productos pierden su costo/)).not.toHaveLength(0);
    fireEvent.click(await busy('Cancelar'));
    fireEvent.click(await busy('Dar de baja el proveedor'));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Dar de baja con sus 12 productos' }),
    );
    await waitFor(() => expect(toast()).toContain('Bulonera Centro: dado de baja'));
    expect(server.bodies(deactivate).at(-1)).toEqual({ confirmed: { costs: 12, discontinued: 3 } });
    expect(await screen.findByText('Dado de baja')).toBeTruthy();
  });

  it('price-lists-R2.6: mientras se aplica una lista suya, no; si falla, lo dice', async () => {
    openSupplier({
      [`${supplierPath}/deactivate`]: [
        { status: 409, body: { error: 'list-applying' } },
        { status: 500, body: { error: 'unexpected' } },
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Dar de baja el proveedor' }));
    expect(await screen.findByText(/se está aplicando/)).toBeTruthy();
    fireEvent.click(await busy('Dar de baja el proveedor'));
    expect(await screen.findByText('No se pudo guardar. Probá de nuevo.')).toBeTruthy();
  });

  it('price-lists-R2.5: un dado de baja se reactiva; si falla, lo dice', async () => {
    openSupplier({
      [supplierPath]: [{ body: supplier({ inactive: true }) }, { body: supplier() }],
      [`${supplierPath}/reactivate`]: [
        { status: 500, body: { error: 'unexpected' } },
        { body: { ok: true } },
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Reactivar' }));
    expect(await screen.findByText('No se pudo guardar. Probá de nuevo.')).toBeTruthy();
    fireEvent.click(await busy('Reactivar'));
    await waitFor(() => expect(toast()).toContain('Bulonera Centro: reactivado'));
  });
});
