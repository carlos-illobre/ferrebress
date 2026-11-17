// Los ajustes de las listas de precios en Administración (06 · R8): el grupo, los seis números con su
// valor de arranque, guardar lo escrito, lo que no vale y su tecla.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startKeyboard } from '../../testing/keyboard.ts';
import { openAdministration, saveOf, seller, tab } from '../../views/basic/administration/kit.tsx';
import { shown } from './model.ts';

const field = (name: string) => screen.getByLabelText(name) as HTMLInputElement;
const type = (name: string, value: string) => {
  const input = field(name);
  input.value = value;
  fireEvent.focusOut(input);
};

describe('Administración, las listas de precios', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => stop());

  it('administration-R8: el grupo muestra sus valores, y el panel los seis con su valor de arranque', async () => {
    openAdministration();
    expect(await screen.findByRole('tab', { name: /Para revisar.*50 %/ })).toBeTruthy();
    expect(tab(/Tamaño de una lista.*30 MB/)).toBeTruthy();
    fireEvent.click(tab(/Espacio de los archivos.*100 MB/));
    expect(field('Aviso de filas').value).toBe('200.000');
    expect(field('Listas sin aplicar').value).toBe('30');
    expect(screen.getByText('De arranque, 200.000 filas')).toBeTruthy();
    expect(screen.getByText('De arranque, 20 %')).toBeTruthy();
  });

  it('administration-R8.5: lo escrito se guarda al salir, con los puntos de miles; sin cambio, nada', async () => {
    const server = openAdministration({
      [saveOf('confirmRows')]: { body: { value: 250_000, version: 1 } },
    });
    fireEvent.click(await screen.findByRole('tab', { name: /Para revisar/ }));
    type('Aviso de filas', '200.000');
    type('Aviso de filas', '250.000');
    await waitFor(() =>
      expect(server.bodies(saveOf('confirmRows'))).toEqual([{ value: 250_000, version: 0 }]),
    );
  });

  it('administration-R8.1: fuera del rango, vacío o con letras, dice entre cuánto va y no guarda', async () => {
    const server = openAdministration();
    fireEvent.click(await screen.findByRole('tab', { name: /Para revisar/ }));
    type('Para revisar', '0');
    expect(await screen.findByText('Va un entero entre 1 y 1.000.')).toBeTruthy();
    type('Espacio de los archivos', '');
    expect(await screen.findByText('Va un entero entre 10 y 100.000.')).toBeTruthy();
    type('Aviso de bajas', 'mucho');
    expect(await screen.findByText('Va un entero entre 1 y 100.')).toBeTruthy();
    expect(server.sent.filter((s) => s.path.startsWith(saveOf('')))).toEqual([]);
  });

  it('sin el permiso, se ven y no se escriben', async () => {
    openAdministration({}, seller);
    fireEvent.click(await screen.findByRole('tab', { name: /Para revisar/ }));
    expect(field('Tamaño de una lista').readOnly).toBe(true);
  });

  it('app-E12: Alt L abre el panel de las listas', async () => {
    openAdministration();
    await screen.findByRole('tab', { name: /Para revisar/ });
    fireEvent.keyDown(window, { key: 'L', code: 'KeyL', altKey: true });
    await waitFor(() => expect(tab(/Para revisar/).getAttribute('aria-selected')).toBe('true'));
  });

  it('cómo se escribe cada valor', () => {
    expect(shown('goneWarnPercent', 20)).toBe('20 %');
    expect(shown('filesMb', 100_000)).toBe('100.000 MB');
    expect(shown('confirmRows', 1_000_000)).toBe('1.000.000 filas');
    expect(shown('unappliedFileDays', 30)).toBe('30 días');
  });
});
