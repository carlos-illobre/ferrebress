// «Se perdió un celular» (02 · R5.7): de quién, cuál y «Cortar».
import { fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { access, openUsers, row, toast } from './users-test-kit.tsx';

const dialog = () => screen.getByRole('alertdialog');
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

  it('sin nadie con celulares, lo dice; si no se pudo preguntar, también', async () => {
    openUsers({
      '/api/lost-phones': [{ body: { people: [] } }, { status: 500, body: { error: 'internal' } }],
    });
    await openLost();
    expect(await within(dialog()).findByText(/Nadie tiene un celular/)).toBeTruthy();
    fireEvent.click(within(dialog()).getByRole('button', { name: /Cancelar/ }));
    await openLost();
    expect(await within(dialog()).findByText('No se pudo. Probá de nuevo.')).toBeTruthy();
  });
});
