// La entrada en Administración (06 · R11): las horas sin conexión de una lista, los tres números de
// intentos con su rango, y su tecla.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startKeyboard } from '../../testing/keyboard.ts';
import { openAdministration, saveOf, tab } from '../../views/basic/administration/kit.tsx';

const field = (name: string) => screen.getByLabelText(name) as HTMLInputElement;
const type = (name: string, value: string) => {
  const input = field(name);
  input.value = value;
  fireEvent.focusOut(input);
};
const open = async (replies = {}) => {
  const server = openAdministration(replies);
  fireEvent.click(await screen.findByRole('tab', { name: /Horas sin conexión.*24 h/ }));
  return server;
};

describe('Administración, la entrada', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => stop());

  it('administration-R11: el grupo Acceso muestra las horas, y el panel los intentos', async () => {
    await open();
    expect(screen.getByRole('heading', { name: 'La entrada' })).toBeTruthy();
    expect(field('Intentos con Google').value).toBe('10');
    expect(field('Intentos con la huella').value).toBe('20');
    expect(field('Intentos fallidos').value).toBe('20');
    expect(screen.getAllByText('por minuto')).toHaveLength(2);
  });

  it('administration-R11.1: las horas se eligen de la lista', async () => {
    const server = await open({ [saveOf('offlineHours')]: { body: { value: 8, version: 1 } } });
    fireEvent.click(screen.getByRole('button', { name: /^8 h/ }));
    await waitFor(() =>
      expect(server.bodies(saveOf('offlineHours'))).toEqual([{ value: 8, version: 0 }]),
    );
  });

  it('administration-E59: 2 o 61 por minuto, o 4 o 101 por hora, no se guardan y dicen el rango', async () => {
    const server = await open();
    type('Intentos con Google', '2');
    expect(await screen.findByText('Va un entero entre 3 y 60.')).toBeTruthy();
    type('Intentos con la huella', '61');
    expect(await screen.findByText('Va un entero entre 3 y 60.')).toBeTruthy();
    type('Intentos fallidos', '4');
    expect(await screen.findByText('Va un entero entre 5 y 100.')).toBeTruthy();
    type('Intentos fallidos', '101');
    expect(await screen.findByText('Va un entero entre 5 y 100.')).toBeTruthy();
    expect(server.sent.filter((s) => s.path.startsWith(saveOf('')))).toEqual([]);
  });

  it('app-E12: Alt E abre el panel de la entrada', async () => {
    openAdministration();
    await screen.findByRole('tab', { name: /Horas sin conexión/ });
    fireEvent.keyDown(window, { key: 'E', code: 'KeyE', altKey: true });
    await waitFor(() =>
      expect(tab(/Horas sin conexión/).getAttribute('aria-selected')).toBe('true'),
    );
  });
});
