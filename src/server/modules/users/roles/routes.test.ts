// Las rutas de los roles (02 · R7, R3.3, R3.8; diseño de 02, §§ 18 y 23), desde la aplicación:
// crear, cambiar y borrar roles, darlos al autorizar y qué permite cada uno.
import { permissionIds } from '@ferrebress/shared/contracts/permissions';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRolesKit, type RolesKit } from '../../../testing/users/roles-kit.ts';

describe('los roles, desde Usuarios', () => {
  let kit: RolesKit;
  beforeAll(async () => {
    kit = await createRolesKit();
  });
  afterAll(() => kit.server.close());

  it('users-E34, E53: recién instalado hay un solo rol, Administrador, con todo, y lo tiene el primero', async () => {
    const { roles } = (await kit.admin.request('/api/roles')).body;
    expect(roles).toEqual([
      {
        id: expect.any(String),
        name: 'Administrador',
        description: expect.any(String),
        system: true,
        version: 1,
        permissions: [...permissionIds].sort(),
        holders: [kit.adminId],
      },
    ]);
    expect(kit.audited('role.permissions-added')).toHaveLength(1);
  });

  it('users-E35, E57: un rol nuevo suma lo que incluye; la descripción es opcional', async () => {
    const created = await kit.admin.request('/api/roles', {
      name: '  Encargado ',
      description: 'Atiende el mostrador y cobra',
      permissions: ['users.cut'],
    });
    expect(created).toMatchObject({
      status: 200,
      body: {
        role: {
          name: 'Encargado',
          description: 'Atiende el mostrador y cobra',
          system: false,
          permissions: ['users.cut', 'users.view'],
          holders: [],
        },
      },
    });
    const plain = await kit.admin.request('/api/roles', {
      name: 'Cajero',
      permissions: ['users.view'],
    });
    expect(plain.body.role).toMatchObject({ description: null, permissions: ['users.view'] });
  });

  it('users-E37: el nombre repetido sin importar mayúsculas, vacío, sin permisos o con repetidos no se guarda', async () => {
    const create = (body: unknown) => kit.admin.request('/api/roles', body);
    expect(await create({ name: 'encargado', permissions: ['users.view'] })).toMatchObject({
      status: 409,
      body: { error: 'role-name-taken' },
    });
    for (const body of [
      { name: '   ', permissions: ['users.view'] },
      { name: 'Otro', permissions: [] },
      { name: 'Otro', permissions: ['users.view', 'users.view'] },
      { name: 'Otro', permissions: ['sales.sell'] },
      { name: 'Otro', permissions: ['users.view'], system: true },
    ])
      expect((await create(body)).status).toBe(400);
  });

  it('users-E39, E40, E60: no se borra el que alguien tiene, aunque esté dado de baja, ni el Administrador', async () => {
    const id = await kit.role('Repositor', ['users.view']);
    const juan = await kit.person([id, await kit.systemRole()]);
    const remove = async (roleId: string) => {
      const { roles } = (await kit.admin.request('/api/roles')).body;
      const { version } = roles.find((role: { id: string }) => role.id === roleId);
      return kit.admin.request(`/api/roles/${roleId}/delete`, { version });
    };
    expect((await remove(id)).body).toEqual({ error: 'role-in-use' });
    const { version } = await kit.row(juan.id);
    await kit.admin.request(`/api/users/${juan.id}/deactivate`, { version });
    expect((await remove(id)).body).toEqual({ error: 'role-in-use' });
    const { roles } = (await kit.admin.request('/api/roles')).body;
    expect(roles.find((role: { id: string }) => role.id === id).holders).toEqual([]);
    expect((await kit.row(juan.id)).roleIds).toContain(id);
    expect((await remove(await kit.systemRole())).body).toEqual({ error: 'system-role' });
    const unused = await kit.role('Sin nadie', ['users.view']);
    expect((await remove(unused)).body).toEqual({ removed: true });
    expect(kit.audited('role.deleted').at(-1)?.data).toMatchObject({ target: 'Sin nadie' });
  });

  it('users-E40: al Administrador se lo puede renombrar', async () => {
    const id = await kit.systemRole();
    const renamed = await kit.admin.request(`/api/roles/${id}`, { version: 1, name: 'Dueño' });
    expect(renamed.body.role).toMatchObject({ name: 'Dueño', version: 2, system: true });
  });

  it('users-E41, E42, E43: autorizar pide los dos permisos y al menos un rol; nadie queda sin roles', async () => {
    const manager = await kit.person([await kit.role('Personal', ['users.manage'])]);
    const authorized = await manager.device.request('/api/users', {
      email: 'nueva@example.com',
      roles: [await kit.systemRole()],
    });
    expect(authorized).toMatchObject({
      status: 403,
      body: { error: 'forbidden', permission: 'roles.manage' },
    });
    expect((await manager.device.request('/api/roles')).status).toBe(403);
    const someone = await kit.person([await kit.systemRole()], { signIn: false });
    const { version } = await kit.row(someone.id);
    const renamed = await manager.device.request(`/api/users/${someone.id}`, {
      version,
      name: 'Ana',
    });
    expect(renamed.status).toBe(200);
    expect(
      (await kit.admin.request('/api/users', { email: 'sin-rol@example.com', roles: [] })).body,
    ).toEqual({ error: 'no-roles' });
    expect((await kit.setRoles(someone.id, [])).body).toEqual({ error: 'no-roles' });
    const unknown = await kit.admin.request('/api/users', {
      email: 'rol-que-no-hay@example.com',
      roles: ['00000000-0000-7000-8000-000000000999'],
    });
    expect(unknown.body).toEqual({ error: 'bad-request' });
  });

  it('users-E44, E47: con dos roles puede lo de los dos; sin el permiso, 403 y la sesión sigue', async () => {
    const view = await kit.role('Mira', ['users.view']);
    const roles = await kit.role('Arma', ['roles.manage']);
    const both = await kit.person([view, roles]);
    expect((await both.device.request('/api/users')).status).toBe(200);
    expect((await both.device.request('/api/roles')).status).toBe(200);
    const only = await kit.person([view]);
    expect((await only.device.request('/api/roles')).body).toEqual({
      error: 'forbidden',
      permission: 'roles.manage',
    });
    expect((await only.device.request('/api/start')).body.person.userId).toBe(only.id);
    expect(kit.audited('permission.denied').at(-1)).toMatchObject({
      userId: only.id,
      data: { permission: 'roles.manage' },
    });
  });
});
