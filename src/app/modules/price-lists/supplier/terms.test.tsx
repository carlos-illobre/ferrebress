// Cómo cobra un proveedor (08 · R3.2, R3.5): cada cambio se guarda entero con su versión; si cambian
// costos, antes se confirma cuántos; si no, con «Deshacer». Los descuentos se agregan, se cambian, se
// quitan y se ordenan (también con Alt ↑ ↓).
import { fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startKeyboard } from '../../../testing/keyboard.ts';
import { admin, toast } from '../../../views/basic/price-lists/readers-kit.tsx';
import {
  openSupplier,
  supplier,
  supplierPath,
  terms,
} from '../../../views/basic/price-lists/supplier/kit.tsx';

const termsPath = `${supplierPath}/terms`;
const saved = (value: unknown, version = 4, costs = 0) => ({ body: { value, version, costs } });
const showTerms = async () => {
  fireEvent.click(await screen.findByRole('tab', { name: /Cómo cobra/ }));
  await screen.findByText('Descuentos, en orden');
};
const typeIn = (input: HTMLElement, value: string) => {
  (input as HTMLInputElement).value = value;
  fireEvent.focusOut(input);
};
const names = () => screen.getAllByLabelText('Nombre del descuento') as HTMLInputElement[];

describe('un proveedor: cómo cobra', () => {
  afterEach(() => vi.restoreAllMocks());

  it('price-lists-R3.5: sin costos que cambien, se guarda con «Deshacer», que vuelve a como estaba', async () => {
    const server = openSupplier({
      [termsPath]: [saved({ ...terms, vatIncluded: true }), saved(terms, 5)],
    });
    await showTerms();
    fireEvent.click(screen.getByLabelText('Sus precios incluyen IVA'));
    await waitFor(() => expect(toast()).toContain('Cómo cobra: guardado'));
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(server.bodies(termsPath)).toHaveLength(2));
    expect(server.bodies(termsPath)).toEqual([
      { terms: { ...terms, vatIncluded: true }, version: 3 },
      { terms, version: 4 },
    ]);
  });

  it('price-lists-R3.5 y E21: si cambian costos, se confirma cuántos; cancelar no guarda', async () => {
    const server = openSupplier({
      [termsPath]: [
        { status: 409, body: { error: 'confirm-costs', costs: 2167 } },
        { status: 409, body: { error: 'confirm-costs', costs: 2167 } },
        saved({ ...terms, defaultVat: 105 }, 4, 2167),
      ],
    });
    await showTerms();
    fireEvent.click(screen.getByLabelText('10,5 %'));
    expect(await screen.findByText(/2\.167 costos cambian ahora/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByText(/2\.167 costos cambian ahora/)).toBeNull();
    fireEvent.click(screen.getByLabelText('10,5 %'));
    fireEvent.click(await screen.findByRole('button', { name: 'Cambiar 2.167 costos' }));
    await waitFor(() => expect(toast()).toContain('Cómo cobra: guardado'));
    expect(server.bodies(termsPath).at(-1)).toEqual({
      terms: { ...terms, defaultVat: 105 },
      version: 3,
      confirmed: 2167,
    });
    expect(screen.queryByRole('button', { name: 'Deshacer' })).toBeNull();
  });

  it('price-lists-R1.7: si otro lo cambió, se ve como está; si se aplica una lista o falla el recálculo, se dice', async () => {
    openSupplier({
      [termsPath]: [
        {
          status: 409,
          body: { error: 'terms-changed', value: { ...terms, onChange: 'next' }, version: 7 },
        },
        { status: 409, body: { error: 'list-applying' } },
        { status: 503, body: { error: 'recalc-failed' } },
        { status: 500, body: { error: 'unexpected' } },
      ],
    });
    await showTerms();
    fireEvent.click(screen.getByLabelText('27 %'));
    expect(await screen.findByText('Lo cambió otra persona recién: así cobra ahora.')).toBeTruthy();
    expect((screen.getByLabelText('Desde la próxima lista') as HTMLInputElement).checked).toBe(
      true,
    );
    for (const said of [/se está aplicando/, /No se pudo recalcular/, /No se pudo guardar/]) {
      fireEvent.click(screen.getByLabelText('Recalcular con la última lista'));
      expect(await screen.findByText(said)).toBeTruthy();
    }
  });

  it('price-lists-R3.2: agregar, cambiar, quitar y ordenar descuentos; lo que no vale se dice', async () => {
    const server = openSupplier({ [termsPath]: saved(terms) });
    await showTerms();
    expect(names().map((input) => input.value)).toEqual(['General', 'Contado']);
    expect((screen.getAllByLabelText('Porcentaje')[0] as HTMLInputElement).value).toBe('25');
    typeIn(screen.getAllByLabelText('Porcentaje')[0] as HTMLElement, '150');
    expect(await screen.findByText(/Un descuento lleva nombre/)).toBeTruthy();
    typeIn(names()[0] as HTMLElement, 'Mayorista');
    await waitFor(() => expect(server.bodies(termsPath).length).toBeGreaterThanOrEqual(1));
    expect(
      (server.bodies(termsPath)[0] as { terms: { discounts: unknown[] } }).terms.discounts[0],
    ).toEqual({
      id: 'g',
      name: 'Mayorista',
      percent: 2500,
      brand: null,
    });
    // El primero no sube: no se manda nada.
    fireEvent.focus(names()[0] as HTMLElement);
    const first = within(screen.getAllByRole('listitem')[0] as HTMLElement);
    fireEvent.click(first.getByRole('button', { name: 'Bajar' }));
    await waitFor(() => expect(server.bodies(termsPath).length).toBeGreaterThanOrEqual(2));
    const second = within(screen.getAllByRole('listitem')[1] as HTMLElement);
    fireEvent.click(second.getByRole('button', { name: 'Subir' }));
    await waitFor(() => expect(server.bodies(termsPath).length).toBeGreaterThanOrEqual(3));
    fireEvent.click(second.getByRole('button', { name: 'Quitar' }));
    await waitFor(() => expect(server.bodies(termsPath).length).toBeGreaterThanOrEqual(4));
    fireEvent.click(screen.getByRole('button', { name: /Agregar descuento/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    expect(await screen.findAllByText(/Un descuento lleva nombre/)).not.toHaveLength(0);
    fireEvent.input(screen.getAllByLabelText('Nombre del descuento').at(-1) as HTMLElement, {
      target: { value: 'Contado' },
    });
    fireEvent.input(screen.getAllByLabelText('Porcentaje').at(-1) as HTMLElement, {
      target: { value: '2,5' },
    });
    fireEvent.input(screen.getAllByLabelText('Marca (vacío: todas)').at(-1) as HTMLElement, {
      target: { value: 'Bremen' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar' }));
    await waitFor(() =>
      expect(
        (server.bodies(termsPath).at(-1) as { terms: { discounts: unknown[] } }).terms.discounts.at(
          -1,
        ),
      ).toMatchObject({ name: 'Contado', percent: 250, brand: 'Bremen' }),
    );
  });

  it('price-lists-R3.2: hasta 20 descuentos; sin descuentos, lo dice; cancelar el nuevo', async () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      id: `d${i}`,
      name: `D${i}`,
      percent: 100,
      brand: null,
    }));
    openSupplier({
      [supplierPath]: {
        body: supplier({ terms: { value: { ...terms, discounts: many }, version: 1 } }),
      },
    });
    await showTerms();
    fireEvent.click(screen.getByRole('button', { name: /Agregar descuento/ }));
    expect(await screen.findByText('Llega a 20 descuentos.')).toBeTruthy();
  });

  it('price-lists-R1.2: con «Ver costos» y sin «Administrar proveedores», se lee y no se cambia', async () => {
    openSupplier({}, { ...admin, permissions: ['price-lists.costs'] });
    await showTerms();
    expect(screen.queryByRole('button', { name: /Agregar descuento/ })).toBeNull();
    expect((names()[0] as HTMLInputElement).readOnly).toBe(true);
  });

  it('sin descuentos lo dice; el nuevo se cancela', async () => {
    openSupplier({
      [supplierPath]: {
        body: supplier({ terms: { value: { ...terms, discounts: [] }, version: 1 } }),
      },
    });
    await showTerms();
    expect(screen.getByText('Sin descuentos.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Agregar descuento/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('button', { name: 'Agregar' })).toBeNull();
  });
});

describe('cómo cobra con el teclado', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => {
    stop();
    vi.restoreAllMocks();
  });

  it('Alt 2 abre cómo cobra, Alt N agrega un descuento y Alt ↑ ↓ mueven el elegido', async () => {
    const swapped = { ...terms, discounts: [terms.discounts[1], terms.discounts[0]] };
    const server = openSupplier({ [termsPath]: [saved(swapped), saved(terms, 5)] });
    await screen.findByRole('heading', { name: 'Bulonera Centro' });
    fireEvent.keyDown(window, { key: '2', code: 'Digit2', altKey: true });
    await screen.findByText('Descuentos, en orden');
    fireEvent.keyDown(window, { key: 'N', code: 'KeyN', altKey: true });
    expect(await screen.findByRole('button', { name: 'Agregar' })).toBeTruthy();
    fireEvent.focus(names()[0] as HTMLElement);
    fireEvent.keyDown(window, { key: 'ArrowDown', code: 'ArrowDown', altKey: true });
    await waitFor(() => expect(names()[0]?.value).toBe('Contado'));
    // El elegido ya es el primero (General, abajo): Alt ↑ lo sube; con el primero, no pasa nada.
    fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp', altKey: true });
    await waitFor(() => expect(server.bodies(termsPath)).toHaveLength(2));
    await waitFor(() => expect(names()[0]?.value).toBe('General'));
    fireEvent.keyDown(window, { key: 'ArrowUp', code: 'ArrowUp', altKey: true });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(server.bodies(termsPath)).toHaveLength(2);
  });
});
