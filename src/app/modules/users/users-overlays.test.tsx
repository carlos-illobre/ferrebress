// Lo que se abre encima de Usuarios (02 · R3.3, R3.8, R5.7): autorizar a alguien, volver a
// confirmar quién es y «Se perdió un celular»; y sus teclas en la computadora.
import { fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { googleFrame, startReply } from '../sign-in/sign-in-test-kit.ts';
import { access, graciela, openUsers, person, row, toast } from './users-test-kit.tsx';

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

  it('Cancelar cierra sin autorizar', async () => {
    openUsers();
    await openAuthorize();
    fireEvent.click(within(dialog()).getByRole('button', { name: /Cancelar/ }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });
});

const lost = (phones: object[]) => ({
  body: { people: [{ userId: 'graciela', displayName: 'Graciela Benítez', self: false, phones }] },
});
const android = {
  id: 'f1',
  deviceLabel: 'Chrome en Android',
  sessions: 1,
  passkey: true,
  lastUsedAt: 1,
};
const iphone = {
  id: 's9',
  deviceLabel: 'Safari en iPhone',
  sessions: 2,
  passkey: false,
  lastUsedAt: null,
};

describe('«Se perdió un celular» (users-R5.7)', () => {
  const openLost = async () => {
    await screen.findByText('Rubén Paredes');
    fireEvent.click(
      screen.getAllByRole('button', { name: /Se perdió un celular/ })[0] as HTMLElement,
    );
  };

  it('users-E31, E32: de quién, cuál y «Cortar», que dice qué cortó', async () => {
    const server = openUsers({
      '/api/lost-phones': lost([android, iphone]),
      '/api/users/graciela/access': { body: access },
      '/api/users/graciela/phones/s9/cut': { body: { sessions: 2, passkey: false } },
    });
    fireEvent.click(await screen.findByText('Graciela Benítez', { selector: '.users-name em' }));
    await openLost();
    fireEvent.click(await within(dialog()).findByRole('button', { name: /Graciela Benítez/ }));
    expect(dialog().querySelector('h2')?.textContent).toBe('¿Cuál celular de Graciela Benítez?');
    const cut = within(dialog()).getByRole('button', { name: /Cortar/ }) as HTMLButtonElement;
    expect(cut.disabled).toBe(true);
    const which = within(dialog()).getByRole('button', { name: /Safari en iPhone/ });
    expect(which.textContent).toContain('2 sesiones abiertas');
    fireEvent.click(which);
    fireEvent.click(cut);
    await waitFor(() =>
      expect(toast()).toBe(
        'Cortado: Safari en iPhone de Graciela Benítez. Se cerraron sus 2 sesiones',
      ),
    );
    expect(server.bodies('/api/users/graciela/phones/s9/cut')).toEqual([{ from: 'lost' }]);
    expect(row(/Graciela/).querySelector('.users-counts')?.textContent).toBe('1');
  });

  it('con un solo celular ya está elegido; si no había nada, lo dice', async () => {
    openUsers({
      '/api/lost-phones': lost([android]),
      '/api/users/graciela/phones/f1/cut': [
        { body: { sessions: 1, passkey: true } },
        { body: { sessions: 0, passkey: false } },
        { status: 500, body: { error: 'internal' } },
      ],
    });
    for (const said of [
      'Se cerró su sesión y se le quitó la huella',
      'no había nada que cortar',
      'No se pudo',
    ]) {
      await openLost();
      fireEvent.click(await within(dialog()).findByRole('button', { name: /Graciela Benítez/ }));
      expect(dialog().querySelector('h2')?.textContent).toBe('El celular de Graciela Benítez');
      fireEvent.click(within(dialog()).getByRole('button', { name: /Cortar/ }));
      await waitFor(() => expect(toast()).toContain(said));
    }
  });

  it('también los propios, con «(vos)»; en el celular se abre desde su renglón', async () => {
    openUsers({
      '/api/lost-phones': {
        body: {
          people: [
            { userId: 'ruben', displayName: 'Rubén Paredes', self: true, phones: [android] },
          ],
        },
      },
    });
    await screen.findByText('Rubén Paredes', { selector: '.users-name em' });
    fireEvent.click(document.querySelector('.users-lost') as HTMLElement);
    expect(
      await within(dialog()).findByRole('button', { name: /Rubén Paredes \(vos\)/ }),
    ).toBeTruthy();
  });

  it('sin nadie con celulares, lo dice; si falla, también queda vacío', async () => {
    openUsers({
      '/api/lost-phones': [{ body: { people: [] } }, { status: 500, body: { error: 'internal' } }],
    });
    await openLost();
    expect(await within(dialog()).findByText(/Nadie tiene un celular/)).toBeTruthy();
    fireEvent.click(within(dialog()).getByRole('button', { name: /Cancelar/ }));
    await openLost();
    expect(await within(dialog()).findByText(/Nadie tiene un celular/)).toBeTruthy();
  });
});
