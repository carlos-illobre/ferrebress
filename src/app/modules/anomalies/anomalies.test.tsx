// Anomalías (06 · pantalla 2, R9): las abiertas con de qué se tratan, los filtros, el detalle con las
// filas salteadas, marcarla revisada con su nota, volver a abrirla, sin conexión y con el teclado.
import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { navigate, route } from '../../platform/router.ts';
import { topScreen } from '../../platform/screens.ts';
import { online } from '../../platform/server/api.ts';
import { startKeyboard } from '../../testing/keyboard.ts';
import {
  anomaliesPath,
  list,
  noCosts,
  openAnomalies,
  openPath,
  reopenOf,
  reviewOf,
  rowsOf,
  skipped,
  unreadable,
} from '../../views/basic/anomalies/kit.tsx';
import { toast } from '../../views/basic/price-lists/readers-kit.tsx';
import type { Anomalies } from './model.ts';

const model = () => topScreen()?.model() as Anomalies;
const openDetail = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const skippedRows = {
  body: {
    rows: [
      { code: null, description: 'Tornillo', skipped: 'no-code', cells: ['', 'Tornillo', '120'] },
    ],
    next: 'abc',
  },
};

describe('Anomalías', () => {
  it('administration-R9.2: las abiertas, con su tipo, de qué se trata y cuándo pasó', async () => {
    openAnomalies();
    expect(await screen.findByText('Sin proveedor todavía · precios.csv')).toBeTruthy();
    expect(screen.getByText('Ningún lector entiende esta planilla')).toBeTruthy();
    expect(screen.getByText('Bulonera Centro · lista.xlsx')).toBeTruthy();
    expect(screen.getByText('Salteó 3 filas: 2 sin código, 1 con precio cero')).toBeTruthy();
    expect(screen.getAllByText('Pasó hace 1 hora')).toHaveLength(2);
  });

  it('administration-E51: sin abiertas, dice que no hay nada; con otro filtro, que no hay con ese filtro', async () => {
    const server = openAnomalies({ [openPath]: { body: { anomalies: [] } } });
    expect(await screen.findByText('No hay nada para revisar.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Revisadas' }));
    expect(await screen.findByText('No hay anomalías con ese filtro.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Filas salteadas' }));
    await waitFor(() =>
      expect(server.sent.map((s) => s.path)).toContain(
        `${anomaliesPath}?status=reviewed&kind=price-list-skipped-rows`,
      ),
    );
  });

  it('price-lists-R9.2: el detalle de las filas salteadas muestra lo que traía cada una, de a 50', async () => {
    openAnomalies({
      [rowsOf()]: skippedRows,
      [rowsOf('abc')]: [
        { status: 500, body: { error: 'unexpected' } },
        { body: { rows: [{ code: 'Z', description: 'Arandela', cells: ['Z', 'Arandela'] }] } },
      ],
    });
    await screen.findByText('Bulonera Centro · lista.xlsx');
    openDetail(/Filas salteadas: Ver el detalle/);
    expect(
      await screen.findByText('120 · Tornillo'.split(' · ').reverse().join(' · ')),
    ).toBeTruthy();
    expect(screen.getByText('Salteada: sin código')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }));
    expect(await screen.findByText('No se pudieron traer las filas.')).toBeTruthy();
    await act(async () => model().rows.more());
    expect(await screen.findByText('Z · Arandela')).toBeTruthy();
    expect(screen.getByText('Tornillo · 120')).toBeTruthy();
    openDetail(/Filas salteadas: Cerrar el detalle/);
    expect(screen.queryByText('Salteada: sin código')).toBeNull();
  });

  it('sin «Ver costos», el detalle dice quién ve las filas; si ya no se guardan, lo dice', async () => {
    openAnomalies({}, noCosts);
    await screen.findByText('Bulonera Centro · lista.xlsx');
    openDetail(/Filas salteadas: Ver el detalle/);
    expect(screen.getByText(/lo ve quien tiene «Ver costos»/)).toBeTruthy();
  });

  it('las filas de una lista que ya no está', async () => {
    openAnomalies({ [rowsOf()]: { status: 404, body: { error: 'not-found' } } });
    await screen.findByText('Bulonera Centro · lista.xlsx');
    openDetail(/Filas salteadas: Ver el detalle/);
    expect(await screen.findByText('Ya no se guardan las filas de esta lista.')).toBeTruthy();
  });

  it('administration-E48: marcarla revisada con una nota la saca de las abiertas', async () => {
    const reviewed = { ...unreadable, status: 'reviewed' as const, note: 'Ya lo hablé' };
    const server = openAnomalies({ [reviewOf(unreadable)]: { body: reviewed } });
    await screen.findByText('Bulonera Centro · lista.xlsx');
    openDetail(/No se pudo leer la lista: Ver el detalle/);
    fireEvent.input(screen.getByLabelText('Nota (si querés)'), {
      target: { value: '  Ya lo hablé ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Marcar revisada' }));
    await waitFor(() => expect(within(list()).queryByText('No se pudo leer la lista')).toBeNull());
    expect(toast()).toContain('Marcada revisada');
    expect(server.bodies(reviewOf(unreadable))).toEqual([{ note: 'Ya lo hablé' }]);
  });

  it('si otra persona la cambió antes, se muestra como está; si falla, lo dice', async () => {
    const closed = { ...unreadable, status: 'closed' as const, closedAt: unreadable.openedAt };
    openAnomalies({
      [reviewOf(unreadable)]: [
        { status: 500, body: { error: 'unexpected' } },
        { status: 409, body: { error: 'anomaly-changed', anomaly: closed } },
      ],
    });
    await screen.findByText('Bulonera Centro · lista.xlsx');
    openDetail(/No se pudo leer la lista: Ver el detalle/);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar revisada' }));
    await waitFor(() => expect(toast()).toContain('No se pudo guardar'));
    // Lo que se toca no se vuelve a mandar hasta que termina (00 · R7).
    const button = screen.getByRole('button', { name: 'Marcar revisada' });
    await waitFor(() => expect(button.getAttribute('aria-busy')).toBe('false'));
    fireEvent.click(button);
    await waitFor(() => expect(toast()).toContain('Otra persona la cambió recién'));
    expect(within(list()).queryByText('No se pudo leer la lista')).toBeNull();
  });

  it('si otra persona le cambió algo y sigue abierta, queda en la lista como está', async () => {
    const touched = { ...skipped, summary: { ...skipped.summary, file: 'otra.xlsx' } };
    openAnomalies({
      [reviewOf(skipped)]: { status: 409, body: { error: 'anomaly-changed', anomaly: touched } },
    });
    await screen.findByText('Bulonera Centro · lista.xlsx');
    openDetail(/Filas salteadas: Ver el detalle/);
    fireEvent.click(screen.getByRole('button', { name: 'Marcar revisada' }));
    expect(await screen.findByText('Bulonera Centro · otra.xlsx')).toBeTruthy();
  });

  it('administration-E49: una revisada se ve con el filtro, con quién y su nota, y se vuelve a abrir', async () => {
    const reviewed = {
      ...unreadable,
      status: 'reviewed' as const,
      reviewedBy: { id: 'u', name: 'Marta' },
      reviewedAt: unreadable.openedAt,
      note: 'Hablé con el proveedor',
    };
    const anonymous = { ...skipped, status: 'reviewed' as const, reviewedAt: skipped.openedAt };
    const server = openAnomalies({
      [openPath]: { body: { anomalies: [] } },
      [`${anomaliesPath}?status=reviewed`]: { body: { anomalies: [reviewed, anonymous] } },
      [reopenOf(reviewed)]: { body: { ...reviewed, status: 'open' } },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Revisadas' }));
    expect(await screen.findByText('Revisada por Marta hace 1 hora')).toBeTruthy();
    expect(screen.getByText('Revisada por otra persona hace 1 hora')).toBeTruthy();
    openDetail(/No se pudo leer la lista: Ver el detalle/);
    expect(screen.getByText('«Hablé con el proveedor»')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Volver a abrir' }));
    await waitFor(() => expect(toast()).toContain('Volvió a las abiertas'));
    expect(server.sent.map((s) => s.path)).toContain(reopenOf(reviewed));
    expect(screen.queryByText('Revisada por Marta hace 1 hora')).toBeNull();
  });

  it('administration-E50: una cerrada sola lo dice', async () => {
    const closed = { ...skipped, status: 'closed' as const, closedAt: skipped.openedAt };
    openAnomalies({ [openPath]: { body: { anomalies: [closed] } } });
    expect(await screen.findByText('Se cerró sola hace 1 hora')).toBeTruthy();
  });

  it('con más de 30, «Ver más» trae las siguientes; si falla, lo dice', async () => {
    const after = `${anomaliesPath}?status=open&after=${unreadable.id}`;
    openAnomalies({
      [openPath]: { body: { anomalies: [unreadable], next: unreadable.id } },
      [after]: [{ status: 500, body: { error: 'unexpected' } }, { body: { anomalies: [skipped] } }],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Ver más' }));
    await waitFor(() => expect(toast()).toContain('No se pudieron traer'));
    fireEvent.click(screen.getByRole('button', { name: 'Ver más' }));
    expect(await screen.findByText('Bulonera Centro · lista.xlsx')).toBeTruthy();
    await model().more();
  });

  it('si no se pudo traer, lo dice y reintenta; volver lleva a Administración', async () => {
    navigate('/administration/anomalies');
    openAnomalies({
      [openPath]: [
        { status: 500, body: { error: 'unexpected' } },
        { body: { anomalies: [skipped] } },
      ],
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Bulonera Centro · lista.xlsx')).toBeTruthy();
    model().back();
    expect(route.get().path).toBe('/administration');
  });
});

describe('Anomalías con el teclado y sin conexión', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => stop());

  it('Alt K marca revisada la elegida', async () => {
    const server = openAnomalies({
      [reviewOf(skipped)]: { body: { ...skipped, status: 'reviewed' } },
    });
    await screen.findByText('Bulonera Centro · lista.xlsx');
    fireEvent.keyDown(window, { key: 'K', code: 'KeyK', altKey: true });
    fireEvent.focus(screen.getByRole('button', { name: /Filas salteadas: Ver el detalle/ }));
    fireEvent.keyDown(window, { key: 'K', code: 'KeyK', altKey: true });
    await waitFor(() => expect(server.bodies(reviewOf(skipped))).toEqual([{}]));
    expect(server.bodies(reviewOf(unreadable))).toEqual([]);
  });

  it('administration-E52: sin conexión, gris lo último que se vio, sin marcar, y Alt R reintenta', async () => {
    const server = openAnomalies();
    await screen.findByText('Bulonera Centro · lista.xlsx');
    openDetail(/No se pudo leer la lista: Ver el detalle/);
    online.set(false);
    expect(await screen.findByText(/Sin conexión: es lo último que se vio/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Marcar revisada' })).toBeNull();
    const asked = () => server.sent.filter((s) => s.path.startsWith(anomaliesPath)).length;
    const before = asked();
    online.set(true);
    fireEvent.keyDown(window, { key: 'R', code: 'KeyR', altKey: true });
    await waitFor(() => expect(asked()).toBeGreaterThan(before));
  });
});
