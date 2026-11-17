// Ver qué cambia y aplicar (08 · pantalla 3, R6): de quién es, el resumen que filtra, el detalle con
// la cuenta de cada costo, aplicar con su avance, los avisos, descartar, cancelar y los permisos.
import { act, fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { route } from '../../../platform/router.ts';
import { online } from '../../../platform/server/api.ts';
import { startKeyboard } from '../../../testing/keyboard.ts';
import { toast } from '../../../views/basic/price-lists/readers-kit.tsx';
import {
  listPath,
  openReview,
  pending,
  rowsPath,
  summary,
} from '../../../views/basic/price-lists/review/kit.tsx';
import { loaderOnly, sellerOnly } from '../../../views/basic/price-lists/suppliers-kit.tsx';

const button = (name: string | RegExp) => screen.getByRole('button', { name });
const applyLabel = /^Aplicar: 4 nuevos, 31 costos, 2 bajas/;

describe('ver qué cambia', () => {
  afterEach(() => vi.restoreAllMocks());

  it('price-lists-R6.2 y R6.3: de quién es, el resumen, el botón y el detalle con su cuenta', async () => {
    openReview();
    expect(await screen.findByText('Lista de Bulonera Centro')).toBeTruthy();
    expect(screen.getByText('Fecha de la lista: 10/11/2023')).toBeTruthy();
    expect(screen.getByText('Lista completa')).toBeTruthy();
    expect(screen.getByText('La subió Rubén Paredes hace 1 hora')).toBeTruthy();
    expect(button('3 para revisar')).toBeTruthy();
    expect(button('31 cambian de costo (+12,5 % en promedio)')).toBeTruthy();
    expect(button('1 fila salteada')).toBeTruthy();
    expect(button(applyLabel)).toBeTruthy();
    expect(await screen.findByText('Mecha 6')).toBeTruthy();
    expect(screen.getByText('+14,7 %')).toBeTruthy();
    expect(screen.getByText('Ahora $ 120,00')).toBeTruthy();
    expect(screen.getByText('Nuevo')).toBeTruthy();
    expect(screen.getByText(/Ya no viene/)).toBeTruthy();
    expect(screen.getByText('Salteada: sin código')).toBeTruthy();
    expect(screen.getByText('Sin código · 100')).toBeTruthy();
    fireEvent.click(button('Ver la cuenta'));
    expect(screen.getByText('Precio de lista: $ 1.210,00')).toBeTruthy();
    expect(screen.getByText('Sin IVA (21 %): $ 1.000,00')).toBeTruthy();
    expect(screen.getByText('Pronto pago (2,5 %): $ 975,00')).toBeTruthy();
    // Bajar el archivo original (R4.4): si ya no se guarda, se dice.
    fireEvent.click(button('Bajar el archivo'));
    await waitFor(() => expect(toast()).not.toBe(''));
    fireEvent.click(button('Ocultar la cuenta'));
    expect(screen.queryByText('Precio de lista: $ 1.210,00')).toBeNull();
  });

  it('price-lists-R6.4: cada número filtra el detalle; «para revisar» explica por qué; tocar de nuevo lo saca', async () => {
    const { server } = openReview({ [`${rowsPath}?show=review`]: { body: { rows: [] } } });
    fireEvent.click(await screen.findByRole('button', { name: '3 para revisar' }));
    expect(await screen.findAllByText(/Para revisar: los costos/)).not.toHaveLength(0);
    expect(await screen.findByText('Ningún producto con eso.')).toBeTruthy();
    expect(server.sent.map((s) => s.path)).toContain(`${rowsPath}?show=review`);
    fireEvent.click(button('3 para revisar'));
    expect(await screen.findByText('Mecha 6')).toBeTruthy();
  });

  it('price-lists-R6.3: se busca y se baja de a partes; si falla, lo dice', async () => {
    const { server } = openReview({
      [rowsPath]: { body: { rows: [{ code: 'A1', description: 'Mecha 6' }], next: 'abc' } },
      [`${rowsPath}?after=abc`]: [
        { status: 500, body: { error: 'unexpected' } },
        { body: { rows: [{ code: 'B1', description: 'Broca' }] } },
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Ver más' }));
    await waitFor(() => expect(toast()).toContain('No se pudieron traer los productos.'));
    fireEvent.click(button('Ver más'));
    expect(await screen.findByText('Broca')).toBeTruthy();
    // Sin más, no se pide nada.
    expect(screen.queryByRole('button', { name: 'Ver más' })).toBeNull();
    fireEvent.input(screen.getByLabelText('Buscar por código, descripción o marca'), {
      target: { value: 'broca' },
    });
    await waitFor(() => expect(server.sent.map((s) => s.path)).toContain(`${rowsPath}?q=broca`));
  });

  it('price-lists-R6.6 y E60: aplicar manda los números que vio, muestra el avance y lo que hizo', async () => {
    const result = { created: 4, changed: 31, gone: 2, restored: 0 };
    const { server, topic, listening } = openReview({
      [listPath]: [{ body: pending() }, { body: pending({ status: 'applied', result }) }],
      [`${listPath}/apply`]: { status: 202, body: pending({ status: 'applying' }) },
    });
    fireEvent.click(await screen.findByRole('button', { name: applyLabel }));
    await waitFor(() => expect(listening()).toBe(true));
    expect(server.bodies(`${listPath}/apply`)).toEqual([
      { expected: { new: 4, changed: 31, gone: 2 } },
    ]);
    expect(screen.getByText('Aplicando: 0 de 138 filas')).toBeTruthy();
    act(() => topic({ status: 'applying', rowsRead: 138, applied: 50, rowsTotal: 138 }));
    expect(await screen.findByText('Aplicando: 50 de 138 filas')).toBeTruthy();
    act(() => topic({ status: 'applied', rowsRead: 138 }));
    expect(
      await screen.findByText(
        'Aplicada: 4 productos creados, 31 costos cambiados, 2 dados de baja.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Aplicada')).toBeTruthy();
  });

  it('price-lists-E64, R6.9: si cambiaron los números, otra persona aplica o falla, lo dice', async () => {
    const { server } = openReview({
      [`${listPath}/apply`]: [
        {
          status: 409,
          body: { error: 'numbers-changed', numbers: { new: 1, changed: 1, gone: 0 } },
        },
        { status: 409, body: { error: 'list-applying' } },
        { status: 500, body: { error: 'unexpected' } },
      ],
    });
    const apply = await screen.findByRole('button', { name: applyLabel });
    for (const said of [
      'Cambió algo desde que se abrió: el botón dice ahora lo que va a pasar.',
      'Otra persona la está aplicando.',
      'No se pudo. Probá de nuevo.',
    ]) {
      fireEvent.click(apply);
      expect(await screen.findByText(said)).toBeTruthy();
    }
    expect(server.sent.filter((s) => s.path === listPath).length).toBeGreaterThan(1);
  });

  it('price-lists-R6.5 y R6.10: da de baja de más, o es más vieja: se avisa', async () => {
    openReview({
      [listPath]: { body: pending({ summary: { ...summary, goneWarning: true, gone: 812 } }) },
    });
    expect(
      await screen.findByRole('button', { name: 'Aplicar y dar de baja 812 productos' }),
    ).toBeTruthy();
    expect(screen.getAllByText(/da de baja 812 productos/i)).not.toHaveLength(0);
  });

  it('price-lists-R6.10: una más vieja que la última aplicada no se aplica, pero se descarta', async () => {
    openReview({ [listPath]: { body: pending({ summary: { ...summary, tooOld: true } }) } });
    expect(
      await screen.findAllByText(/anterior a la de la última lista aplicada/),
    ).not.toHaveLength(0);
    expect(screen.queryByRole('button', { name: applyLabel })).toBeNull();
    expect(button('Descartar')).toBeTruthy();
  });

  it('price-lists-R6.11: descartar la deja descartada y vuelve a Listas', async () => {
    openReview({
      [`${listPath}/discard`]: [
        { status: 500, body: { error: 'unexpected' } },
        { body: pending({ status: 'discarded' }) },
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Descartar' }));
    expect(await screen.findByText('No se pudo. Probá de nuevo.')).toBeTruthy();
    fireEvent.click(button('Descartar'));
    await waitFor(() => expect(toast()).toContain('Lista descartada'));
    expect(route.get().path).toBe('/catalog');
  });

  it('price-lists-R4.11: mientras se aplica, cancelar; si volvió a esperar, dice por qué', async () => {
    const { server } = openReview({
      [listPath]: { body: pending({ status: 'applying' }) },
      [`${listPath}/cancel`]: [
        { status: 202, body: { cancelling: true } },
        { status: 500, body: {} },
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(server.bodies(`${listPath}/cancel`)).toHaveLength(1));
    fireEvent.click(button('Cancelar'));
    expect(await screen.findByText('No se pudo. Probá de nuevo.')).toBeTruthy();
  });

  it('price-lists-R6.6: si no se aplicó, la lista sigue en espera con el motivo', async () => {
    openReview({ [listPath]: { body: pending({ reason: 'apply-failed' }) } });
    expect(
      await screen.findByText('No se aplicó: No se pudo aplicar. La lista sigue en espera.'),
    ).toBeTruthy();
  });

  it('una lista que ya no espera dice su estado y no ofrece nada; sin archivo, lo dice', async () => {
    openReview({
      [listPath]: {
        body: pending({ status: 'discarded', file: false, newReader: true }),
      },
    });
    expect(await screen.findByText('Descartada')).toBeTruthy();
    expect(screen.getByText('Ya no se guarda el archivo')).toBeTruthy();
    expect(screen.getAllByText(/Lector nuevo/)).not.toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Descartar' })).toBeNull();
  });

  it('price-lists-R1.2: sin «Cargar listas», se ve pero no se aplica ni se descarta', async () => {
    openReview({}, sellerOnly);
    await screen.findByText('Lista de Bulonera Centro');
    expect(screen.queryByRole('button', { name: applyLabel })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Descartar' })).toBeNull();
    expect(loaderOnly.permissions).toContain('price-lists.load');
  });

  it('si no se pudo traer, lo dice y reintenta', async () => {
    openReview({
      [listPath]: [{ status: 500, body: { error: 'unexpected' } }, { body: pending() }],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Lista de Bulonera Centro')).toBeTruthy();
  });
});

describe('ver qué cambia con el teclado y sin conexión', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => {
    stop();
    vi.restoreAllMocks();
  });

  it('Alt A aplica y Alt D descarta', async () => {
    const { server } = openReview({
      [`${listPath}/apply`]: { status: 500, body: { error: 'unexpected' } },
      [`${listPath}/discard`]: { status: 500, body: { error: 'unexpected' } },
    });
    await screen.findByRole('button', { name: applyLabel });
    fireEvent.keyDown(window, { key: 'A', code: 'KeyA', altKey: true });
    await waitFor(() => expect(server.bodies(`${listPath}/apply`)).toHaveLength(1));
    fireEvent.keyDown(window, { key: 'D', code: 'KeyD', altKey: true });
    await waitFor(() => expect(server.bodies(`${listPath}/discard`)).toHaveLength(1));
  });

  it('sin conexión, gris lo último que se vio, sin aplicar, y Alt R reintenta', async () => {
    const { server } = openReview();
    await screen.findByRole('button', { name: applyLabel });
    online.set(false);
    expect(await screen.findByText(/Sin conexión: es lo último que se vio/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: applyLabel })).toBeNull();
    const asked = () => server.sent.filter((s) => s.path === listPath).length;
    const before = asked();
    online.set(true);
    fireEvent.keyDown(window, { key: 'R', code: 'KeyR', altKey: true });
    await waitFor(() => expect(asked()).toBeGreaterThan(before));
  });
});
