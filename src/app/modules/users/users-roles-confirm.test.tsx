// Crear un rol y lo que da acceso (02 · R7.3, R3.8, E35, E50): pide confirmar quién es y se repite
// solo; cancelar no crea nada.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { googleFrame, startReply } from '../sign-in/sign-in-test-kit.ts';
import { encRow, openRoles, roleCard, rolesRoute, settle } from './users-roles-kit.tsx';
import { roleRows, toast } from './users-test-kit.tsx';

describe('crear roles y dar acceso', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('users-E35, E50: «Nuevo rol» arranca vacío; sin confirmar quién es, lo pide y lo crea solo', async () => {
    const frame = googleFrame();
    const created = { ...encRow, id: 'caja', name: 'Caja', version: 1, holders: [] };
    const server = await openRoles({
      '/api/roles': [
        rolesRoute,
        { status: 403, body: { error: 'confirm-first' } },
        { body: { role: created } },
        { body: { roles: [...roleRows, encRow, created] } },
      ],
      '/api/start': startReply(),
      '/api/session/confirm/google': {},
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Nuevo rol/ })[0] as HTMLElement);
    const name = roleCard().getByRole('textbox', { name: 'Nombre' }) as HTMLInputElement;
    expect(name.value).toBe('');
    fireEvent.input(name, { target: { value: 'Caja' } });
    fireEvent.click(roleCard().getByRole('switch', { name: 'Trabajar sin conexión' }));
    fireEvent.click(roleCard().getByRole('button', { name: /Crear el rol/ }));
    expect(await screen.findByRole('alertdialog', { name: 'Confirmá que sos vos' })).toBeTruthy();
    frame.ready();
    await waitFor(() => expect(server.bodies('/api/start')).toHaveLength(1));
    frame.credential('pase');
    await waitFor(() => expect(toast()).toBe('Rol «Caja» creado'));
    await waitFor(() => expect(document.querySelector('.role-new')).toBeNull());
  });

  it('cancelar un rol nuevo lo cierra sin crearlo', async () => {
    const server = await openRoles();
    fireEvent.click(screen.getAllByRole('button', { name: /Nuevo rol/ })[0] as HTMLElement);
    fireEvent.click(roleCard().getByRole('button', { name: 'Cancelar' }));
    await settle();
    expect(document.querySelector('.role-new')).toBeNull();
    expect(server.bodies('/api/roles').filter(Boolean)).toEqual([]);
  });

  it('users-E50: agregarle un permiso o darle un rol a alguien pide confirmar y sigue solo', async () => {
    const frame = googleFrame();
    const confirm = { status: 403, body: { error: 'confirm-first' } };
    const server = await openRoles({
      '/api/roles/enc': [confirm, { body: { role: encRow } }],
      '/api/users/graciela/roles': [confirm, { body: { roles: [] } }],
      '/api/start': startReply(),
      '/api/session/confirm/google': {},
    });
    fireEvent.click(screen.getByText('Encargado de turno', { selector: 'b' }));
    fireEvent.click(roleCard().getByRole('switch', { name: 'Administrar roles' }));
    await screen.findByRole('alertdialog', { name: 'Confirmá que sos vos' });
    frame.ready();
    await waitFor(() => expect(server.bodies('/api/start')).toHaveLength(1));
    frame.credential('pase');
    await waitFor(() => expect(server.bodies('/api/roles/enc')).toHaveLength(2));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    fireEvent.change(roleCard().getByRole('combobox'), { target: { value: '' } });
    fireEvent.change(roleCard().getByRole('combobox'), { target: { value: 'graciela' } });
    await screen.findByRole('alertdialog', { name: 'Confirmá que sos vos' });
    frame.ready();
    await waitFor(() => expect(server.bodies('/api/start').length).toBeGreaterThan(1));
    frame.credential('pase');
    await waitFor(() => expect(server.bodies('/api/users/graciela/roles')).toHaveLength(2));
  });

  it('si al repetirlo después de confirmar el nombre ya está, lo dice y sigue en el rol nuevo', async () => {
    const frame = googleFrame();
    const server = await openRoles({
      '/api/roles': [
        rolesRoute,
        { status: 403, body: { error: 'confirm-first' } },
        { status: 409, body: { error: 'role-name-taken' } },
        rolesRoute,
      ],
      '/api/start': startReply(),
      '/api/session/confirm/google': {},
    });
    fireEvent.click(screen.getAllByRole('button', { name: /Nuevo rol/ })[0] as HTMLElement);
    fireEvent.input(roleCard().getByRole('textbox', { name: 'Nombre' }), {
      target: { value: 'Administrador' },
    });
    fireEvent.click(roleCard().getByRole('switch', { name: 'Trabajar sin conexión' }));
    fireEvent.click(roleCard().getByRole('button', { name: /Crear el rol/ }));
    await screen.findByRole('alertdialog', { name: 'Confirmá que sos vos' });
    frame.ready();
    await waitFor(() => expect(server.bodies('/api/start')).toHaveLength(1));
    frame.credential('pase');
    await waitFor(() =>
      expect(toast()).toBe('Ya hay un rol con ese nombre (sin importar mayúsculas).'),
    );
    expect(document.querySelector('.role-new')).toBeTruthy();
  });
});
