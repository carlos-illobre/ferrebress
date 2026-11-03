// Lo que encontraron las revisiones del paso 7 (diseño de 02, §§ 18, 19 y 21): un nombre repetido al
// renombrar, el tope de roles, quien ya no puede no cambia nada aunque su pedido estuviera en camino,
// la auditoría con lo de antes y lo de después, borrar sobre quien tiene más y el alta que avisa.
import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRolesKit, minutes, type RolesKit } from '../../../testing/users/roles-kit.ts';
import { createPeople } from '../people.ts';
import { createRoleChanges } from './changes.ts';

describe('los límites de los roles', () => {
  let kit: RolesKit;
  beforeAll(async () => {
    kit = await createRolesKit();
  });
  afterAll(() => kit.server.close());

  const versionOf = async (id: string) =>
    (await kit.admin.request('/api/roles')).body.roles.find(
      (role: { id: string }) => role.id === id,
    ).version;

  it('users-E37: renombrar con un nombre que ya tiene otro rol, sin importar mayúsculas, da 409', async () => {
    await kit.role('Caja', ['users.view']);
    const other = await kit.role('Depósito', ['users.view']);
    const renamed = await kit.admin.request(`/api/roles/${other}`, {
      version: await versionOf(other),
      name: 'CAJA',
    });
    expect(renamed).toMatchObject({ status: 409, body: { error: 'role-name-taken' } });
  });

  it('users-R6.1: crear, renombrar y borrar dejan el id y lo de antes y después', async () => {
    const id = await kit.role('Temporal', ['users.view']);
    expect(kit.audited('role.created').at(-1)).toMatchObject({
      targets: [{ kind: 'role', id, name: 'Temporal' }],
      changes: {
        name: { before: null, after: 'Temporal' },
        permissions: { before: null, after: ['users.view'] },
      },
    });
    await kit.admin.request(`/api/roles/${id}`, { version: 1, description: 'Por un rato' });
    expect(kit.audited('role.changed').at(-1)?.changes).toEqual({
      description: { before: null, after: 'Por un rato' },
    });
    await kit.admin.request(`/api/roles/${id}/delete`, { version: 2 });
    expect(kit.audited('role.deleted').at(-1)).toMatchObject({
      targets: [{ kind: 'role', id, name: 'Temporal' }],
      changes: {
        name: { before: 'Temporal', after: null },
        description: { before: 'Por un rato', after: null },
        permissions: { before: ['users.view'], after: null },
      },
    });
  });

  it('seguridad 32: a quien le sacaron el permiso no le sirve un pedido que estaba en camino', async () => {
    const view = await kit.role('Solo ve', ['users.view']);
    const roles = await kit.role('Arma', ['roles.manage']);
    const ana = await kit.person([roles]);
    await kit.setRoles(ana.id, [view]);
    const changes = createRoleChanges(kit.server.platform);
    expect(
      await changes.create(ana.id, true, { name: 'Mío', permissions: ['users.manage'] }),
    ).toEqual({ refused: 'forbidden', detail: {} });
    const people = createPeople(kit.server.platform);
    expect(await people.deactivate(ana.id, kit.adminId, 1)).toEqual({ refused: 'forbidden' });
  });

  it('seguridad 34: confirmar quién es y «tiene más», rechazados, quedan en la auditoría', async () => {
    kit.later(minutes(6));
    await kit.admin.request('/api/users', {
      email: 'tarde@example.com',
      roles: [await kit.systemRole()],
    });
    expect(kit.audited('users.rejected').at(-1)).toMatchObject({
      data: { reason: 'confirm-first' },
    });
    expect(kit.audited('users.rejected').at(-1)?.targets).toBeUndefined();
    await kit.reconfirm();
    const staff = await kit.person([await kit.role('Personal', ['users.manage'])]);
    const target = await kit.person([await kit.systemRole()], { signIn: false });
    const { version } = await kit.row(target.id);
    // R7.11: tampoco se borra su alta.
    expect(
      (await staff.device.request(`/api/users/${target.id}/delete`, { version })).body,
    ).toEqual({
      error: 'outranked',
    });
    expect(kit.audited('users.rejected').at(-1)).toMatchObject({
      actor: { kind: 'person', userId: staff.id },
      targets: [{ kind: 'person', id: target.id }],
      data: { reason: 'outranked' },
    });
  });

  it('seguridad 36: dar de alta avisa que cambiaron sus permisos', async () => {
    const juan = await kit.person([await kit.systemRole()]);
    const { version } = await kit.row(juan.id);
    await kit.admin.request(`/api/users/${juan.id}/deactivate`, { version });
    expect(await kit.server.users.permissionsOf(juan.id)).toEqual([]);
    await kit.admin.request(`/api/users/${juan.id}/activate`, { version: version + 1 });
    expect(await kit.server.users.permissionsOf(juan.id)).toContain('roles.manage');
  });

  it('seguridad 38: no se crean más de 100 roles', async () => {
    const { db } = kit.server.platform;
    await sql`insert into users.roles (id, name)
      select gen_random_uuid(), 'Relleno ' || n from generate_series(1, 100) as n`.execute(db);
    const created = await kit.admin.request('/api/roles', {
      name: 'Uno más',
      permissions: ['users.view'],
    });
    expect(created).toMatchObject({ status: 409, body: { error: 'too-many-roles' } });
  });

  it('una falla de la base al cambiar un rol no se toma por un nombre repetido', async () => {
    // Ya hay 100 roles (la prueba de antes): se usa el Administrador.
    const id = await kit.systemRole();
    const changes = createRoleChanges(kit.server.platform);
    await expect(
      changes.change(kit.adminId, true, id, 2 ** 40, { name: 'Otro' }),
    ).rejects.toThrow();
  });
});
