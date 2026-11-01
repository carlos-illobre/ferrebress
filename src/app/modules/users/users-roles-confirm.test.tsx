import { fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { route } from '../../platform/router.ts';
import { googleFrame, startReply } from '../sign-in/sign-in-test-kit.ts';
import {
  encRow,
  everyone,
  lucia,
  openRoles,
  role,
  rolesRoute,
  saveButton,
  shift,
  typeIn,
} from './users-roles-kit.tsx';
import { person, roleRows, roles, toast } from './users-test-kit.tsx';

const holder = (name: string) => within(role().getByText(name).closest('li') as HTMLElement);
const give = async (name: string) => {
  fireEvent.click(role().getByRole('button', { name: /Darle este rol a…/ }));
  const picker = await screen.findByRole('alertdialog', { name: 'Darle este rol a…' });
  fireEvent.click(within(picker).getByText(name));
};

describe('quiénes tienen el rol, y lo que da acceso (02 · R7.13, R3.8)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('users-E62, E63: dar y sacar quedan marcados hasta guardar, con «Deshacer», y van en el pedido', async () => {
    const server = await openRoles(
      { '/api/roles/enc': { body: { role: encRow } } },
      '/users/roles/enc',
    );
    fireEvent.click(holder('Lucía Fernández').getByRole('button', { name: 'Sacárselo' }));
    expect(holder('Lucía Fernández').getByText('Se lo sacás al guardar')).toBeTruthy();
    await give('Martín Sosa');
    expect(holder('Martín Sosa').getByText('Se lo das al guardar')).toBeTruthy();
    fireEvent.click(holder('Lucía Fernández').getByRole('button', { name: 'Deshacer' }));
    fireEvent.click(saveButton());
    await waitFor(() =>
      expect(server.bodies('/api/roles/enc')).toEqual([{ version: 3, give: ['martin'] }]),
    );
  });

  it('users-E65: a quien es su único rol se le marca en su renglón, y no se pide nada', async () => {
    const solo = { ...lucia, roleIds: ['enc'] };
    const server = await openRoles(
      {
        '/api/users': {
          body: {
            roles: [...roles, shift],
            people: [...everyone.filter((one) => one.id !== 'lucia'), solo],
          },
        },
      },
      '/users/roles/enc',
    );
    fireEvent.click(holder('Lucía Fernández').getByRole('button', { name: 'Sacárselo' }));
    fireEvent.click(saveButton());
    expect(await screen.findAllByText(/Lucía Fernández se quedaría sin roles/)).toHaveLength(1);
    expect(screen.getByText(/Corregí lo que está marcado en rojo: Lucía Fernández\./)).toBeTruthy();
    expect(server.bodies('/api/roles/enc')).toEqual([]);
  });

  it('users-E65: lo que rechaza el servidor va al renglón de esa persona; sacarse lo suyo, al permiso', async () => {
    await openRoles(
      {
        '/api/roles/enc': [
          { status: 409, body: { error: 'person-inactive', userId: 'martin' } },
          { status: 409, body: { error: 'self', permission: 'roles.manage' } },
          { status: 409, body: { error: 'person-missing', userId: 'martin' } },
          { status: 409, body: { error: 'person-missing', userId: 'nadie' } },
          { status: 409, body: { error: 'too-many-requests' } },
        ],
      },
      '/users/roles/enc',
    );
    await give('Martín Sosa');
    fireEvent.click(saveButton());
    expect(
      await screen.findAllByText('Martín Sosa está dada de baja: no se le puede dar el rol.'),
    ).toHaveLength(1);
    fireEvent.click(saveButton());
    expect(await screen.findByText(/marcado en rojo: «Administrar roles»\./)).toBeTruthy();
    fireEvent.click(saveButton());
    expect(await screen.findAllByText(/la borraron mientras armabas el rol/)).toHaveLength(1);
    fireEvent.click(saveButton());
    expect(await screen.findByText(/marcado en rojo: una persona que ya no está\./)).toBeTruthy();
    fireEvent.click(saveButton());
    await waitFor(() => expect(toast()).toBe('Demasiados cambios seguidos. Esperá un minuto.'));
  });

  it('users-E60: las dadas de baja no figuran entre quienes lo tienen, pero se dice que también lo tienen', async () => {
    const gone = person({
      id: 'sofia',
      displayName: 'Sofía Blanco',
      active: false,
      roleIds: ['enc'],
    });
    await openRoles(
      { '/api/users': { body: { roles: [...roles, shift], people: [...everyone, gone] } } },
      '/users/roles/enc',
    );
    expect(role().getByText('También lo tienen, dadas de baja: Sofía Blanco.')).toBeTruthy();
    fireEvent.click(role().getAllByRole('button', { name: /Borrar el rol/ })[0] as HTMLElement);
    await waitFor(() =>
      expect(toast()).toBe(
        'No se puede borrar: lo tienen Lucía Fernández, Sofía Blanco (dada de baja). Primero hay que sacárselo.',
      ),
    );
  });

  it('users-E38, E39: duplicar arma uno nuevo sin personas; uno que nadie tiene se borra', async () => {
    const nobody = { ...encRow, id: 'nada', name: 'Sin nadie', description: null, version: 1 };
    const server = await openRoles(
      {
        '/api/roles': [{ body: { roles: [...roleRows, encRow, nobody] } }, rolesRoute],
        '/api/roles/nada/delete': { body: { removed: true } },
      },
      '/users/roles/nada',
    );
    fireEvent.click(role().getAllByRole('button', { name: /Borrar el rol/ })[0] as HTMLElement);
    await waitFor(() => expect(toast()).toBe('Se borró el rol «Sin nadie».'));
    expect(server.bodies('/api/roles/nada/delete')).toEqual([{ version: 1 }]);
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir «Encargado de turno»' }));
    await screen.findByText('Información del rol');
    fireEvent.click(role().getAllByRole('button', { name: /Duplicar/ })[0] as HTMLElement);
    await waitFor(() =>
      expect(toast()).toBe('Copia de «Encargado de turno»: cambiale el nombre y guardala.'),
    );
    expect((role().getByLabelText(/Nombre del rol/) as HTMLInputElement).value).toBe(
      'Copia de Encargado de turno',
    );
    expect(role().getByText(/Nadie lo tiene todavía/)).toBeTruthy();
    expect(saveButton().disabled).toBe(false);
  });

  it('el Administrador no se borra: no muestra el botón', async () => {
    await openRoles({}, `/users/roles/${roleRows[0]?.id}`);
    expect(role().queryByRole('button', { name: /Borrar el rol/ })).toBeNull();
    expect(role().getByText(/Podés cambiar este rol cuando quieras/)).toBeTruthy();
  });

  it('users-E50, E62: con la confirmación vieja dice qué da, confirma una vez y lo repite', async () => {
    const frame = googleFrame();
    const created = { ...encRow, id: 'caja', name: 'Caja', version: 1 };
    const server = await openRoles(
      {
        '/api/roles': [
          rolesRoute,
          { status: 403, body: { error: 'confirm-first' } },
          { body: { role: created } },
          rolesRoute,
        ],
        '/api/start': startReply(),
        '/api/session/confirm/google': {},
      },
      '/users/roles/new',
    );
    typeIn('Nombre del rol', 'Caja');
    fireEvent.click(role().getByRole('checkbox', { name: /^Ver las personas/ }));
    await give('Martín Sosa');
    fireEvent.click(saveButton());
    const sheet = await screen.findByRole('alertdialog', { name: 'Confirmá que sos vos' });
    expect(within(sheet).getByText('Creás el rol «Caja».')).toBeTruthy();
    expect(within(sheet).getByText('Le das «Caja» a Martín Sosa.')).toBeTruthy();
    frame.ready();
    await waitFor(() => expect(server.bodies('/api/start')).toHaveLength(1));
    frame.credential('pase');
    await waitFor(() => expect(toast()).toBe('Se creó el rol «Caja».'));
    expect(server.bodies('/api/roles').filter(Boolean)).toHaveLength(2);
    expect(route.get().state).toEqual({ arriving: 'caja' });
  });

  it('si otra persona cambió el rol, lo trae y vuelve a poner lo armado encima, y lo dice', async () => {
    const changed = { ...encRow, name: 'Encargado general', version: 4 };
    const server = await openRoles(
      {
        '/api/roles/enc': { status: 409, body: { error: 'changed' } },
        '/api/roles': [rolesRoute, { body: { roles: [...roleRows, changed] } }],
      },
      '/users/roles/enc',
    );
    typeIn('Descripción', 'Mía');
    fireEvent.click(saveButton());
    expect(
      await screen.findByText(/Otra persona cambió este rol mientras lo armabas/),
    ).toBeTruthy();
    expect((role().getByLabelText(/Nombre del rol/) as HTMLInputElement).value).toBe(
      'Encargado general',
    );
    expect((role().getByLabelText(/Descripción/) as HTMLTextAreaElement).value).toBe('Mía');
    expect(server.bodies('/api/roles/enc')).toHaveLength(1);
  });

  it('«Darle este rol a…» busca por nombre o correo y se cierra sin elegir', async () => {
    await openRoles({}, '/users/roles/enc');
    fireEvent.click(role().getByRole('button', { name: /Darle este rol a…/ }));
    const picker = await screen.findByRole('alertdialog', { name: 'Darle este rol a…' });
    fireEvent.input(within(picker).getByRole('searchbox'), { target: { value: 'nadie así' } });
    expect(within(picker).getByText('No hay nadie más para darle este rol.')).toBeTruthy();
    fireEvent.input(within(picker).getByRole('searchbox'), { target: { value: 'graciela@' } });
    expect(within(picker).queryByText('Martín Sosa')).toBeNull();
    expect(within(picker).getByText('Graciela Benítez')).toBeTruthy();
    fireEvent.click(within(picker).getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
  });

  it('users-E50: sumarle un permiso a un rol que existe dice cuál al confirmar', async () => {
    googleFrame();
    await openRoles(
      {
        '/api/roles/enc': { status: 403, body: { error: 'confirm-first' } },
        '/api/start': startReply(),
      },
      '/users/roles/enc',
    );
    fireEvent.click(role().getByRole('button', { name: /Sin conexión/ }));
    fireEvent.click(role().getByRole('checkbox', { name: /^Trabajar sin conexión/ }));
    fireEvent.click(saveButton());
    const sheet = await screen.findByRole('alertdialog', { name: 'Confirmá que sos vos' });
    expect(
      within(sheet).getByText('Le sumás a «Encargado de turno»: «Trabajar sin conexión».'),
    ).toBeTruthy();
  });

  it('borrar un rol que el servidor no deja borrar lo dice', async () => {
    const nobody = { ...encRow, id: 'nada', name: 'Sin nadie', description: null, version: 1 };
    await openRoles(
      {
        '/api/roles': { body: { roles: [...roleRows, encRow, nobody] } },
        '/api/roles/nada/delete': { status: 409, body: { error: 'role-in-use' } },
      },
      '/users/roles/nada',
    );
    fireEvent.click(role().getAllByRole('button', { name: /Borrar el rol/ })[0] as HTMLElement);
    await waitFor(() =>
      expect(toast()).toBe('Alguien tiene ese rol: primero sacáselo a esas personas.'),
    );
  });
});
