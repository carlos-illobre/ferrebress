// La tarjeta de una persona (02 · R3.5 a R3.7, R4, R5): sus sesiones y celulares, cambiar el nombre
// o el correo, borrar el alta, dar de baja y de alta, y los rechazos del servidor.
import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  access,
  card,
  graciela,
  inCard,
  openUsers,
  pedro,
  row,
  sofia,
  toast,
} from './users-test-kit.tsx';

const choose = async (name: RegExp) => {
  await screen.findByText('Rubén Paredes');
  fireEvent.click(row(name));
};
const press = (input: HTMLElement, key: string) => fireEvent.keyDown(input, { key });

describe('la tarjeta de una persona', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('users-R5.1, R5.2, R5.5: sin elegir a nadie lo dice; elegida, sus sesiones y celulares', async () => {
    openUsers({ '/api/users/graciela/access': { body: access } });
    await screen.findByText('Rubén Paredes');
    expect(card().textContent).toContain('Elegí a alguien');
    await choose(/Graciela/);
    expect(await inCard().findByText('Chrome en Windows')).toBeTruthy();
    expect(card().textContent).toContain('Google · Entró hace 3 días');
    expect(card().textContent).toContain('Huella · Entró ayer');
    expect(card().textContent).toContain('Todavía no se usó');
    expect(card().textContent).toContain('Usado ayer');
    expect(row(/Graciela/).getAttribute('aria-current')).toBe('true');
    expect(inCard().getByRole('button', { name: /Cerrar todas/ })).toBeTruthy();
  });

  it('en la computadora, al abrir queda elegida la primera de la lista', async () => {
    openUsers({ '/api/users/ruben/access': { body: { sessions: [], phones: [] } } }, true, true);
    await waitFor(() => expect(row(/Rubén/).getAttribute('aria-current')).toBe('true'));
    expect(await inCard().findByText(/No te podés dar de baja vos/)).toBeTruthy();
  });

  it('users-R5.3, R5.6: «Cerrar» y «Quitar», sin confirmación, y lo que no había', async () => {
    const empty = { sessions: [], phones: [] };
    const server = openUsers({
      '/api/users/graciela/access': [
        { body: access },
        { body: access },
        { body: access },
        { body: empty },
      ],
      '/api/users/graciela/sessions/s1/close': [{ body: { closed: 1 } }, { body: { closed: 0 } }],
      '/api/users/graciela/phones/f1/cut': [
        { body: { sessions: 1, passkey: true } },
        { body: { sessions: 0, passkey: false } },
      ],
    });
    await choose(/Graciela/);
    await inCard().findByText('Chrome en Windows');
    fireEvent.click(inCard().getAllByRole('button', { name: 'Cerrar' })[0] as HTMLElement);
    await waitFor(() => expect(toast()).toBe('Sesión cerrada · Chrome en Windows'));
    fireEvent.click(inCard().getAllByRole('button', { name: 'Cerrar' })[0] as HTMLElement);
    await waitFor(() => expect(toast()).toContain('Ya estaba cerrada'));
    fireEvent.click(inCard().getAllByRole('button', { name: 'Quitar' })[0] as HTMLElement);
    await waitFor(() => expect(toast()).toContain('y se cerró su sesión'));
    expect(inCard().getByText('Sin sesiones abiertas en otros dispositivos.')).toBeTruthy();
    expect(inCard().getByText('No vinculó ningún celular con huella.')).toBeTruthy();
    expect(row(/Graciela/).querySelector('.users-counts')?.textContent).toBe('');
    expect(server.bodies('/api/users/graciela/phones/f1/cut')).toEqual([{ from: 'card' }]);
  });

  it('quitar un celular que ya no estaba lo dice', async () => {
    openUsers({
      '/api/users/graciela/access': { body: access },
      '/api/users/graciela/phones/f1/cut': { body: { sessions: 0, passkey: false } },
    });
    await choose(/Graciela/);
    fireEvent.click((await inCard().findAllByRole('button', { name: 'Quitar' }))[0] as HTMLElement);
    await waitFor(() => expect(toast()).toContain('no había nada que cortar'));
  });

  it('users-E20, E24: cancelar «Dar de baja» o «Cerrar todas» no cambia nada', async () => {
    const server = openUsers({ '/api/users/graciela/access': { body: access } });
    await choose(/Graciela/);
    await inCard().findByText('Chrome en Windows');
    for (const name of [/Dar de baja/, /Cerrar todas/]) {
      fireEvent.click(inCard().getByRole('button', { name }));
      fireEvent.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: /Cancelar/ }),
      );
      await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    }
    expect(server.sent.map((one) => one.path)).toEqual([
      '/api/users',
      '/api/users/graciela/access',
    ]);
    expect(row(/Graciela/).classList.contains('off')).toBe(false);
    expect(card().textContent).toContain('Autorizada el');
  });

  it('users-R1.2: el primer Administrador dice «Desde la instalación»', async () => {
    openUsers({ '/api/users/ruben/access': { body: { sessions: [], phones: [] } } });
    await choose(/Rubén/);
    expect(card().textContent).toContain('Desde la instalación');
  });

  it('users-R5.4: «Cerrar todas» pide confirmación y dice cuántas cerró', async () => {
    const server = openUsers({
      '/api/users/graciela/access': { body: access },
      '/api/users/graciela/sessions/close': { body: { closed: 2 } },
    });
    await choose(/Graciela/);
    fireEvent.click(await inCard().findByRole('button', { name: /Cerrar todas/ }));
    const dialog = screen.getByRole('alertdialog', {
      name: '¿Cerrar las 2 sesiones de Graciela Benítez?',
    });
    expect(dialog.textContent).toContain('Chrome en Android · Usada hace 1 hora');
    fireEvent.click(screen.getAllByRole('button', { name: /Cerrar todas/ }).at(-1) as HTMLElement);
    await waitFor(() => expect(toast()).toBe('Se cerraron las 2 sesiones'));
    expect(server.bodies('/api/users/graciela/sessions/close')).toHaveLength(1);
  });

  it('users-R5.2, E03: en la propia, la nota de «Salir», la de Configuración y que no se da de baja', async () => {
    openUsers({ '/api/users/ruben/access': { body: { sessions: [], phones: [] } } });
    await choose(/Rubén/);
    expect(await inCard().findByText(/La sesión de esta computadora no figura/)).toBeTruthy();
    expect(inCard().getByText('Los tuyos van en Configuración.')).toBeTruthy();
    expect(inCard().getByText(/No te podés dar de baja vos/)).toBeTruthy();
    expect(inCard().queryByRole('button', { name: /Dar de baja/ })).toBeNull();
  });

  it('users-R3.5: el nombre se cambia con Enter, Esc cancela y vacío vuelve al de Google', async () => {
    const server = openUsers({
      '/api/users/graciela/access': { body: access },
      '/api/users/graciela': [
        { body: { person: { ...graciela, displayName: 'Gra', name: 'Gra', version: 2 } } },
        { body: { person: { ...graciela, name: null, version: 3 } } },
      ],
    });
    await choose(/Graciela/);
    fireEvent.click(inCard().getByRole('button', { name: 'Cambiar el nombre' }));
    let input = inCard().getByRole('textbox', { name: 'Cambiar el nombre' });
    press(input, 'Escape');
    expect(inCard().queryByRole('textbox')).toBeNull();
    fireEvent.click(inCard().getByRole('button', { name: 'Cambiar el nombre' }));
    input = inCard().getByRole('textbox', { name: 'Cambiar el nombre' });
    fireEvent.input(input, { target: { value: 'Gra' } });
    (input as HTMLInputElement).value = 'Gra';
    press(input, 'Enter');
    await waitFor(() => expect(toast()).toBe('Nombre guardado'));
    fireEvent.click(inCard().getByRole('button', { name: 'Cambiar el nombre' }));
    input = inCard().getByRole('textbox', { name: 'Cambiar el nombre' });
    (input as HTMLInputElement).value = '  ';
    press(input, 'a');
    press(input, 'Enter');
    await waitFor(() => expect(toast()).toBe('Nombre borrado: se ve el de Google'));
    expect(server.bodies('/api/users/graciela')).toEqual([
      { version: 1, name: 'Gra' },
      { version: 2, name: null },
    ]);
  });

  it('users-R3.6, R3.7, E13 a E16: quien nunca entró cambia el correo o se borra; el correo ocupado se dice ahí', async () => {
    openUsers({
      '/api/users/pedro': [
        { status: 409, body: { error: 'email-taken' } },
        {
          body: {
            person: {
              ...pedro,
              email: 'p2@example.com',
              displayName: 'p2@example.com',
              version: 2,
            },
          },
        },
      ],
      '/api/users/pedro/delete': { body: { removed: true } },
    });
    await choose(/pedro/);
    expect(card().textContent).toContain('Ferrebress no le manda ningún correo');
    fireEvent.click(inCard().getByRole('button', { name: 'Cambiar el correo' }));
    const input = inCard().getByRole('textbox', { name: 'Cambiar el correo' }) as HTMLInputElement;
    input.value = 'graciela@example.com';
    press(input, 'Enter');
    expect(await inCard().findByRole('alert')).toBeTruthy();
    expect(inCard().getByRole('alert').textContent).toContain('ya está cargado');
    fireEvent.input(input);
    input.value = 'p2@example.com';
    press(input, 'Enter');
    await waitFor(() => expect(toast()).toBe('Correo cambiado: entra con la cuenta nueva'));
    fireEvent.click(inCard().getByRole('button', { name: /Borrar el alta/ }));
    await waitFor(() => expect(toast()).toBe('Se borró el alta de p2@example.com'));
    expect(screen.queryByText('p2@example.com')).toBeNull();
    // Borrar el nombre de quien nunca entró vuelve a su correo.
  });

  it('users-R4.1: dar de baja pide confirmación, dice lo que pasa y deja sus cantidades en cero', async () => {
    const off = { ...graciela, active: false, deactivatedAt: graciela.authorizedAt, version: 2 };
    openUsers({
      '/api/users/graciela/access': { body: access },
      '/api/users/graciela/deactivate': { body: { person: off } },
    });
    await choose(/Graciela/);
    fireEvent.click(inCard().getByRole('button', { name: /Dar de baja/ }));
    const dialog = screen.getByRole('alertdialog', { name: '¿Dar de baja a Graciela Benítez?' });
    expect(dialog.textContent).toContain('Se cierran sus 2 sesiones');
    expect(dialog.textContent).toContain('Se quita su 1 celular con huella');
    fireEvent.click(screen.getAllByRole('button', { name: /Dar de baja/ }).at(-1) as HTMLElement);
    await waitFor(() => expect(toast()).toBe('Graciela Benítez quedó dada de baja'));
    expect(row(/Graciela/).classList.contains('off')).toBe(true);
    expect(card().textContent).toContain('No puede entrar');
    expect(card().textContent).toContain('Dada de baja el');
  });

  it('users-R4.2: dar de alta a alguien dado de baja', async () => {
    openUsers({
      '/api/users/sofia/activate': {
        body: { person: { ...sofia, active: true, deactivatedAt: null, version: 2 } },
      },
    });
    await choose(/Sofía/);
    fireEvent.click(inCard().getByRole('button', { name: /Dar de alta/ }));
    await waitFor(() => expect(toast()).toBe('Sofía Blanco puede entrar otra vez'));
    expect(row(/Sofía/).classList.contains('off')).toBe(false);
  });

  it('en lo angosto, la tarjeta es un paso atrás: «Volver a la lista» y el botón atrás vuelven', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('max-width'),
      media: query,
    }));
    openUsers({ '/api/users/graciela/access': { body: access } });
    await choose(/Graciela/);
    fireEvent.click(screen.getByRole('button', { name: /Volver a la lista/ }));
    expect(card().textContent).toContain('Elegí a alguien');
    fireEvent.click(row(/Graciela/));
    act(() => {
      dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(card().textContent).toContain('Elegí a alguien');
  });
});
