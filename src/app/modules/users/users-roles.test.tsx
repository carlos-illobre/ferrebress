// La pestaña Roles (02 · R7.1, R7.3, E34 a E40, E57): cuántos hay y quién puede qué, la lista, la
// tarjeta de un rol con sus permisos, quiénes lo tienen, darlo y sacarlo, duplicar y borrar.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { all, encRow, openRoles, roleCard, rolesRoute } from './users-roles-kit.tsx';
import { graciela, openUsers, person, roleRows, roles, ruben, toast } from './users-test-kit.tsx';

describe('la pestaña Roles', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('users-E34, E57: cuántos roles y personas, quién puede qué, y el primero elegido', async () => {
    await openRoles();
    const tab = document.querySelector('.roles-body') as HTMLElement;
    expect(tab.textContent).toContain('2Roles');
    expect(tab.textContent).toContain('3Personas');
    expect(tab.textContent).toContain('de 3 personas');
    expect(roleCard().getByText('Administrador')).toBeTruthy();
    expect(roleCard().getByText('Puede todo.')).toBeTruthy();
    expect(document.querySelector('.roles-row .users-pill')?.textContent).toBe('El tuyo');
    expect(document.querySelector('.role-note')?.textContent).toBe('El Administrador no se borra.');
  });

  it('users-E36: prender un permiso guarda solo; lo incluido queda con candado', async () => {
    const server = await openRoles({
      '/api/roles/enc': { body: { role: { ...encRow, version: 4 } } },
    });
    fireEvent.click(screen.getByText('Encargado de turno', { selector: 'b' }));
    const view = roleCard().getByRole('switch', { name: 'Ver las personas' });
    expect(view.getAttribute('aria-checked')).toBe('true');
    expect((view as HTMLButtonElement).disabled).toBe(true);
    expect(roleCard().getByText('Va incluido en «Cortar sesiones y huellas».')).toBeTruthy();
    fireEvent.click(roleCard().getByRole('switch', { name: 'Administrar roles' }));
    await waitFor(() => expect(toast()).toBe('Rol guardado'));
    expect(server.bodies('/api/roles/enc')).toEqual([
      { version: 3, permissions: ['users.cut', 'users.view', 'roles.manage'] },
    ]);
  });

  it('users-E40: el nombre y la descripción se cambian con el lápiz', async () => {
    const server = await openRoles({ '/api/roles/enc': { body: { role: encRow } } });
    fireEvent.click(screen.getByText('Encargado de turno', { selector: 'b' }));
    fireEvent.click(roleCard().getByRole('button', { name: 'Cambiar el nombre del rol' }));
    const name = roleCard().getByRole('textbox', { name: 'Cambiar el nombre del rol' });
    fireEvent.input(name, { target: { value: '  ' } });
    fireEvent.keyDown(name, { key: 'Enter' });
    expect(await roleCard().findByText('Ponele un nombre.')).toBeTruthy();
    fireEvent.input(name, { target: { value: 'Encargado ' } });
    fireEvent.keyDown(name, { key: 'Enter' });
    await waitFor(() => expect(server.bodies('/api/roles/enc')).toHaveLength(1));
    fireEvent.click(roleCard().getByRole('button', { name: 'Cambiar la descripción' }));
    const text = roleCard().getByRole('textbox', { name: 'Cambiar la descripción' });
    fireEvent.input(text, { target: { value: ' ' } });
    fireEvent.keyDown(text, { key: 'Enter' });
    await waitFor(() => expect(server.bodies('/api/roles/enc')).toHaveLength(2));
    expect(server.bodies('/api/roles/enc')).toEqual([
      { version: 3, name: 'Encargado' },
      { version: 3, description: null },
    ]);
  });

  it('users-E39, E43: quiénes lo tienen; sacárselo a quien tiene otro y dárselo a alguien', async () => {
    const two = person({
      id: 'lucia',
      displayName: 'Lucía Fernández',
      roleIds: ['enc', roles[0]?.id as string],
    });
    const server = await openRoles({
      '/api/users': { body: { ...all, people: [ruben, graciela, two] } },
      '/api/users/lucia/roles': { body: { roles: [] } },
      '/api/users/graciela/roles': { body: { roles: [] } },
    });
    fireEvent.click(screen.getByText('Encargado de turno', { selector: 'b' }));
    fireEvent.click(roleCard().getByRole('button', { name: 'Sacárselo' }));
    await waitFor(() => expect(server.bodies('/api/users/lucia/roles')).toHaveLength(1));
    expect(server.bodies('/api/users/lucia/roles')[0]).toEqual({
      version: 1,
      roles: [roles[0]?.id],
    });
    fireEvent.change(roleCard().getByRole('combobox'), { target: { value: 'graciela' } });
    await waitFor(() => expect(server.bodies('/api/users/graciela/roles')).toHaveLength(1));
    expect(server.bodies('/api/users/graciela/roles')[0]).toEqual({
      version: 1,
      roles: [roles[0]?.id, 'enc'],
    });
  });

  it('users-E43: a quien es su único rol no se le saca: lo dice', async () => {
    await openRoles();
    fireEvent.click(screen.getByText('Encargado de turno', { selector: 'b' }));
    expect(roleCard().getByText(/Es su único rol/)).toBeTruthy();
    expect(roleCard().queryByRole('button', { name: 'Sacárselo' })).toBeNull();
  });

  it('users-E38, E37: duplicar arma uno nuevo con lo mismo; sin nombre o sin permisos no se crea', async () => {
    const created = { ...encRow, id: 'copy', name: 'Copia', version: 1, holders: [] };
    const server = await openRoles({
      '/api/roles': [rolesRoute, { body: { role: created } }, rolesRoute],
    });
    fireEvent.click(screen.getByText('Encargado de turno', { selector: 'b' }));
    fireEvent.click(roleCard().getByRole('button', { name: /Duplicar/ }));
    const name = roleCard().getByRole('textbox', { name: 'Nombre' }) as HTMLInputElement;
    expect(name.value).toBe('Encargado de turno (copia)');
    fireEvent.input(name, { target: { value: ' ' } });
    fireEvent.click(roleCard().getByRole('button', { name: /Crear el rol/ }));
    expect((await roleCard().findByRole('alert')).textContent).toBe('Ponele un nombre.');
    fireEvent.input(name, { target: { value: 'Copia' } });
    fireEvent.click(roleCard().getByRole('switch', { name: 'Cortar sesiones y huellas' }));
    fireEvent.click(roleCard().getByRole('switch', { name: 'Ver las personas' }));
    fireEvent.click(roleCard().getByRole('button', { name: /Crear el rol/ }));
    await waitFor(() =>
      expect(roleCard().getByRole('alert').textContent).toBe('Tildá al menos un permiso.'),
    );
    fireEvent.click(roleCard().getByRole('switch', { name: 'Trabajar sin conexión' }));
    fireEvent.input(roleCard().getByRole('textbox', { name: 'Descripción' }), {
      target: { value: 'Para probar' },
    });
    fireEvent.click(roleCard().getByRole('button', { name: /Crear el rol/ }));
    await waitFor(() => expect(toast()).toBe('Rol «Copia» creado'));
    expect(server.bodies('/api/roles').filter(Boolean)).toContainEqual({
      name: 'Copia',
      description: 'Para probar',
      permissions: ['offline.work'],
    });
  });

  it('mientras trae los roles, lo dice; «Usuarios» vuelve a la lista', async () => {
    openUsers({ '/api/roles': 'waiting' });
    await screen.findByText('Rubén Paredes');
    fireEvent.click(screen.getByRole('button', { name: /^Roles$/ }));
    expect(await screen.findByText('Buscando los roles')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^Usuarios$/ }));
    expect(screen.getByText('Rubén Paredes')).toBeTruthy();
  });

  it('users-E39: borrar uno que alguien tiene lo dice; uno que nadie tiene se borra', async () => {
    const free = { ...encRow, id: 'free', name: 'Solo mirar', description: null, holders: [] };
    const server = await openRoles({
      '/api/roles': { body: { roles: [...roleRows, encRow, free] } },
      '/api/roles/enc/delete': { status: 409, body: { error: 'role-in-use' } },
      '/api/roles/free/delete': { body: { removed: true } },
    });
    fireEvent.click(screen.getByText('Encargado de turno', { selector: 'b' }));
    fireEvent.click(roleCard().getByRole('button', { name: /Borrar el rol/ }));
    await waitFor(() =>
      expect(toast()).toBe('Alguien tiene ese rol: primero sacáselo a esas personas.'),
    );
    fireEvent.click(screen.getByText('Solo mirar', { selector: 'b' }));
    expect(roleCard().getByText('Nadie')).toBeTruthy();
    expect(roleCard().getByText('Sin descripción')).toBeTruthy();
    expect(roleCard().getByText('2 permisos · Lo tienen 0 personas')).toBeTruthy();
    fireEvent.click(roleCard().getByRole('button', { name: /Borrar el rol/ }));
    await waitFor(() => expect(toast()).toBe('Rol «Solo mirar» borrado'));
    expect(server.bodies('/api/roles/free/delete')).toEqual([{ version: 3 }]);
  });

  it('quién puede qué, en singular y sin nadie', async () => {
    const alone = { ...encRow, permissions: ['users.view'], holders: ['lucia'] };
    openUsers({ '/api/users': { body: all }, '/api/roles': { body: { roles: [alone] } } });
    await screen.findByText('Rubén Paredes');
    fireEvent.click(screen.getByRole('button', { name: /^Roles$/ }));
    expect(await screen.findByText('de 1 persona')).toBeTruthy();
    await waitFor(() =>
      expect(roleCard().getByText('1 permiso · Lo tiene 1 persona')).toBeTruthy(),
    );
  });

  it('sin nadie con roles, las barras quedan vacías', async () => {
    const empty = { ...encRow, holders: [] };
    openUsers({ '/api/users': { body: all }, '/api/roles': { body: { roles: [empty] } } });
    await screen.findByText('Rubén Paredes');
    fireEvent.click(screen.getByRole('button', { name: /^Roles$/ }));
    expect(await screen.findByText('de 0 personas')).toBeTruthy();
  });
});
