// Lo que se abre encima de Usuarios (02 · R3.3, R3.8, R5.7): autorizar a alguien, volver a
// confirmar quién es y «Se perdió un celular»; y sus teclas en la computadora.
import { fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { googleFrame, startReply } from '../sign-in/sign-in-test-kit.ts';
import { graciela, openUsers, person, row, toast } from './users-test-kit.tsx';

const dialog = () => screen.getByRole('alertdialog');
const field = (name: RegExp) => within(dialog()).getByRole('textbox', { name }) as HTMLInputElement;
const type = (input: HTMLInputElement, value: string) =>
  fireEvent.input(input, { target: { value } });
const authorizeButton = () => within(dialog()).getByRole('button', { name: /^Autorizar/ });
const openAuthorize = async () => {
  await screen.findByText('Rubén Paredes');
  fireEvent.click(screen.getAllByRole('button', { name: /Autorizar a alguien/ })[0] as HTMLElement);
};
const nueva = person({
  id: 'nueva',
  displayName: 'Nueva',
  lastSignInAt: null,
  neverSignedIn: true,
});

describe('autorizar a alguien', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('users-E10, E09, E08: sin forma de correo o ya cargado, se dice junto al correo; si no, queda elegida', async () => {
    const server = openUsers({
      '/api/users': [
        { body: { people: [] } },
        { status: 409, body: { error: 'email-taken' } },
        { body: { person: nueva } },
      ],
    });
    await screen.findByText('Nadie en este filtro.');
    fireEvent.click(
      screen.getAllByRole('button', { name: /Autorizar a alguien/ })[0] as HTMLElement,
    );
    type(field(/Nombre/), 'Nueva');
    type(field(/Correo/), 'no es correo');
    fireEvent.click(authorizeButton());
    expect((await within(dialog()).findByRole('alert')).textContent).toContain(
      'no tiene forma de correo',
    );
    expect(server.sent).toHaveLength(1);
    type(field(/Correo/), 'Nueva@Example.com ');
    expect(within(dialog()).queryByRole('alert')).toBeNull();
    fireEvent.click(authorizeButton());
    expect((await within(dialog()).findByRole('alert')).textContent).toContain('ya está cargado');
    expect(field(/Nombre/).value).toBe('Nueva');
    fireEvent.submit(dialog().querySelector('form') as HTMLFormElement);
    await waitFor(() => expect(toast()).toBe('Autorizada. Avisale que entre con Google'));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(row(/Nueva/).getAttribute('aria-current')).toBe('true');
    expect(server.bodies('/api/users').at(-1)).toEqual({
      email: 'Nueva@Example.com',
      name: 'Nueva',
    });
  });

  it('users-R3.8: sin Google ni huella reciente, pide confirmar y, al confirmar, autoriza sola', async () => {
    const frame = googleFrame();
    const server = openUsers({
      '/api/users': [
        { body: { people: [graciela] } },
        { status: 403, body: { error: 'confirm-first' } },
        { body: { person: nueva } },
      ],
      '/api/start': startReply(),
      '/api/session/confirm/google': {},
    });
    await screen.findByText('Graciela Benítez');
    fireEvent.click(
      screen.getAllByRole('button', { name: /Autorizar a alguien/ })[0] as HTMLElement,
    );
    type(field(/Correo/), 'nueva@example.com');
    fireEvent.click(authorizeButton());
    expect(await screen.findByRole('alertdialog', { name: 'Confirmá que sos vos' })).toBeTruthy();
    frame.ready();
    await waitFor(() => expect(server.bodies('/api/start')).toHaveLength(1));
    frame.credential('pase');
    await waitFor(() => expect(server.bodies('/api/users').filter(Boolean)).toHaveLength(2));
    await waitFor(() => expect(row(/Nueva/).getAttribute('aria-current')).toBe('true'));
    expect(server.bodies('/api/session/confirm/google')).toEqual([{ credential: 'pase' }]);
  });

  it('users-R3.3, R3.8: después de confirmar, un correo repetido se dice junto al campo', async () => {
    const frame = googleFrame();
    const server = openUsers({
      '/api/users': [
        { body: { people: [graciela] } },
        { status: 403, body: { error: 'confirm-first' } },
        { status: 409, body: { error: 'email-taken' } },
      ],
      '/api/start': startReply(),
      '/api/session/confirm/google': {},
    });
    await screen.findByText('Graciela Benítez');
    fireEvent.click(
      screen.getAllByRole('button', { name: /Autorizar a alguien/ })[0] as HTMLElement,
    );
    type(field(/Correo/), 'graciela@example.com');
    fireEvent.click(authorizeButton());
    await screen.findByRole('alertdialog', { name: 'Confirmá que sos vos' });
    frame.ready();
    await waitFor(() => expect(server.bodies('/api/start')).toHaveLength(1));
    frame.credential('pase');
    await waitFor(() => expect(server.bodies('/api/users').filter(Boolean)).toHaveLength(2));
    const form = await screen.findByRole('alertdialog', { name: 'Autorizar a alguien' });
    expect((await within(form).findByRole('alert')).textContent).toContain('ya está cargado');
    expect((within(form).getByRole('textbox', { name: /Correo/ }) as HTMLInputElement).value).toBe(
      'graciela@example.com',
    );
  });

  it('si el servidor falla, lo dice y no cierra', async () => {
    openUsers({
      '/api/users': [
        { body: { people: [graciela] } },
        { status: 500, body: { error: 'internal' } },
      ],
    });
    await screen.findByText('Graciela Benítez');
    fireEvent.click(
      screen.getAllByRole('button', { name: /Autorizar a alguien/ })[0] as HTMLElement,
    );
    type(field(/Correo/), 'nueva@example.com');
    fireEvent.click(authorizeButton());
    await waitFor(() => expect(toast()).toBe('No se pudo. Probá de nuevo.'));
    expect(dialog()).toBeTruthy();
  });

  it('users-R3.8: dar de alta también pide confirmar y sigue sola', async () => {
    const frame = googleFrame();
    const sofia = person({ id: 'sofia', displayName: 'Sofía Blanco', active: false });
    const server = openUsers({
      '/api/users': { body: { people: [sofia] } },
      '/api/users/sofia/activate': [
        { status: 403, body: { error: 'confirm-first' } },
        { body: { person: { ...sofia, active: true, version: 2 } } },
      ],
      '/api/start': startReply(),
      '/api/session/confirm/google': {},
    });
    fireEvent.click(await screen.findByText('Sofía Blanco', { selector: '.users-name em' }));
    fireEvent.click(screen.getByRole('button', { name: /Dar de alta/ }));
    await screen.findByRole('alertdialog', { name: 'Confirmá que sos vos' });
    frame.ready();
    await waitFor(() => expect(server.bodies('/api/start')).toHaveLength(1));
    frame.credential('pase');
    await waitFor(() => expect(server.bodies('/api/users/sofia/activate')).toHaveLength(2));
  });

  it('Cancelar cierra sin autorizar; en la computadora el cursor arranca en el nombre', async () => {
    openUsers();
    await openAuthorize();
    expect(document.activeElement).toBe(field(/Nombre/));
    fireEvent.click(within(dialog()).getByRole('button', { name: /Cancelar/ }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });
});
