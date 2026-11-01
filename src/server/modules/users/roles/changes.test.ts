// Los cambios de roles (02 · R7, R1.3, R3.8; diseño de 02, §§ 17, 19 y 23): valen desde el próximo
// pedido, dar algo pide confirmar, quedan en la auditoría, nadie se saca lo suyo ni deja sin quien
// administre, y nadie actúa sobre quien tiene más.
import { parseServerHeader } from '@ferrebress/shared/contracts/server-header';
import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRolesKit, type RolesKit } from '../../../testing/users/roles-kit.ts';
import { createPeople } from '../people.ts';
import { createAccess } from './access.ts';
import { createRoleChanges } from './changes.ts';

describe('los cambios de roles', () => {
  let kit: RolesKit;
  beforeAll(async () => {
    kit = await createRolesKit();
  });
  afterAll(() => kit.server.close());

  const roleOf = async (id: string) =>
    (await kit.admin.request('/api/roles')).body.roles.find(
      (role: { id: string }) => role.id === id,
    );

  it('users-E48, E49, E55: sacar o sumar valen desde el próximo pedido, y quedan con antes y después', async () => {
    const view = await kit.role('Mira', ['users.view']);
    const other = await kit.role('Otro', ['offline.work']);
    const ana = await kit.person([view]);
    const first = await ana.device.request('/api/users');
    expect(first.status).toBe(200);
    expect((await kit.setRoles(ana.id, [other])).body).toEqual({ roles: [other] });
    const lost = await ana.device.request('/api/users');
    expect(lost.body).toEqual({ error: 'forbidden', permission: 'users.view' });
    const hash = (header: string | null) => parseServerHeader(header)?.permissions;
    expect(hash(lost.header)).toMatch(/^[0-9a-f]{8}$/);
    expect(hash(lost.header)).not.toBe(hash(first.header));
    expect(kit.audited('user.roles-changed').at(-1)?.data).toEqual({
      target: ana.id,
      before: ['Mira'],
      after: ['Otro'],
    });
    const { version } = await roleOf(other);
    const changed = await kit.admin.request(`/api/roles/${other}`, {
      version,
      permissions: ['offline.work', 'roles.manage'],
    });
    expect(changed.body.role.permissions).toEqual(['offline.work', 'roles.manage', 'users.view']);
    expect((await ana.device.request('/api/users')).status).toBe(200);
    expect(kit.audited('role.changed').at(-1)?.data).toEqual({
      target: 'Otro',
      roleId: other,
      before: { name: 'Otro', description: null, permissions: ['offline.work'] },
      after: {
        name: 'Otro',
        description: null,
        permissions: ['offline.work', 'roles.manage', 'users.view'],
      },
    });
  });

  it('users-E50: con la confirmación vieja, dar pide confirmar (también cambiar uno por otro); quitar no', async () => {
    const view = await kit.role('Ve', ['users.view']);
    const cut = await kit.role('Corta', ['users.cut']);
    const juan = await kit.person([view, cut]);
    kit.later();
    expect((await kit.setRoles(juan.id, [view])).status).toBe(200);
    expect((await kit.setRoles(juan.id, [cut])).body).toEqual({ error: 'confirm-first' });
    expect((await kit.row(juan.id)).roleIds).toEqual([view]);
    const { version } = await roleOf(view);
    const adding = { version, permissions: ['users.view', 'offline.work'] };
    expect((await kit.admin.request(`/api/roles/${view}`, adding)).body).toEqual({
      error: 'confirm-first',
    });
    expect(
      (await kit.admin.request(`/api/roles/${view}`, { version, name: 'Mira todo' })).status,
    ).toBe(200);
    const creating = { name: 'Nuevo', permissions: ['users.view'] };
    expect((await kit.admin.request('/api/roles', creating)).body).toEqual({
      error: 'confirm-first',
    });
    await kit.reconfirm();
  });

  it('users-E56: nadie se saca a sí mismo lo que le deja administrar', async () => {
    const system = await kit.systemRole();
    const view = await kit.role('Solo ve', ['users.view']);
    await kit.person([system]);
    expect((await kit.setRoles(kit.adminId, [view])).body).toEqual({ error: 'self' });
    const { version } = await roleOf(system);
    const removing = { version, permissions: ['users.view', 'users.manage'] };
    expect((await kit.admin.request(`/api/roles/${system}`, removing)).body).toEqual({
      error: 'self',
    });
    expect((await roleOf(system)).permissions).toContain('roles.manage');
  });

  it('users-E59: quien nunca entró no cuenta para que quede alguien que administre', async () => {
    const kit2 = await createRolesKit();
    const system = await kit2.systemRole();
    const roles = await kit2.role('Arma roles', ['roles.manage']);
    const asking = await kit2.person([roles]);
    await kit2.person([system], { signIn: false });
    const left = await kit2.setRoles(kit2.adminId, [roles], asking.device);
    expect(left.body).toEqual({ error: 'last-administrator' });
    expect((await kit2.row(kit2.adminId)).roleIds).toEqual([system]);
    await kit2.server.close();
  });

  it('users-E58: sobre quien tiene más no se cambia el correo ni se da de baja o de alta', async () => {
    const staff = await kit.role('Personal', ['users.manage', 'users.cut']);
    const boss = await kit.person([staff]);
    const target = await kit.person([await kit.systemRole()], { signIn: false });
    const { version } = await kit.row(target.id);
    for (const [path, body] of [
      [`/api/users/${target.id}`, { version, email: 'otro@example.com' }],
      [`/api/users/${target.id}/deactivate`, { version }],
      [`/api/users/${target.id}/activate`, { version }],
    ] as const)
      expect((await boss.device.request(path, body)).body).toEqual({ error: 'outranked' });
    const seen = (await boss.device.request('/api/users')).body.people;
    const outranks = (id: string) => seen.find((one: { id: string }) => one.id === id).outranks;
    expect([outranks(target.id), outranks(boss.id)]).toEqual([true, false]);
    const renamed = await boss.device.request(`/api/users/${target.id}`, { version, name: 'Jefa' });
    expect(renamed.status).toBe(200);
  });

  it('users-E51: un permiso nuevo se le suma solo al Administrador, una vez y con su línea', async () => {
    const { db } = kit.server.platform;
    const other = await kit.role('Sin conexión', ['users.view']);
    await sql`delete from users.known_permissions where permission = 'offline.work'`.execute(db);
    await sql`delete from users.role_permissions where permission = 'offline.work'`.execute(db);
    const before = kit.audited('role.permissions-added').length;
    const access = createAccess(kit.server.platform);
    await access.addNewPermissions();
    await access.addNewPermissions();
    expect(
      kit
        .audited('role.permissions-added')
        .slice(before)
        .map((one) => one.data),
    ).toEqual([{ role: 'system', permissions: ['offline.work'] }]);
    expect((await roleOf(await kit.systemRole())).permissions).toContain('offline.work');
    expect((await roleOf(other)).permissions).toEqual(['users.view']);
  });

  it('users-E30: con una versión vieja trae que cambió; lo que no existe, 404', async () => {
    const id = await kit.role('Viejo', ['users.view']);
    const juan = await kit.person([id]);
    const missing = '00000000-0000-7000-8000-000000000999';
    const asking = { version: 999, roles: [id] };
    expect((await kit.admin.request(`/api/users/${juan.id}/roles`, asking)).body).toEqual({
      error: 'changed',
    });
    expect((await kit.admin.request(`/api/users/${missing}/roles`, asking)).status).toBe(404);
    const other = { version: 1, roles: [missing] };
    expect((await kit.admin.request(`/api/users/${juan.id}/roles`, other)).status).toBe(400);
    const { version } = await roleOf(id);
    expect(
      (await kit.admin.request(`/api/roles/${id}`, { version: version + 1, name: 'X' })).body,
    ).toEqual({ error: 'changed' });
    expect((await kit.admin.request(`/api/roles/${missing}`, { version, name: 'X' })).status).toBe(
      404,
    );
    for (const target of [id, missing])
      expect((await kit.admin.request(`/api/roles/${target}/delete`, { version: 9 })).status).toBe(
        target === id ? 409 : 404,
      );
  });

  it('una falla de la base no se toma por un rechazo', async () => {
    const broken = new Proxy(
      {},
      {
        get: () => {
          throw new Error('la base no contesta');
        },
      },
    );
    const platform = { ...kit.server.platform, db: broken } as typeof kit.server.platform;
    const people = createPeople(platform);
    const id = '00000000-0000-7000-8000-000000000999';
    await expect(people.authorize(kit.adminId, 'x@example.com', null, [id])).rejects.toThrow(
      'la base no contesta',
    );
    await expect(people.deactivate(kit.adminId, id, 1)).rejects.toThrow('la base no contesta');
    await expect(createRoleChanges(platform).remove(kit.adminId, id, 1)).rejects.toThrow(
      'la base no contesta',
    );
  });

  it('users-R7.7: quiénes tienen un permiso, solo con nombres de personas activas', async () => {
    const kit3 = await createRolesKit();
    const named = await kit3.person([await kit3.systemRole()], { name: 'Lucía' });
    await kit3.person([await kit3.systemRole()], { signIn: false });
    const holders = await named.device.request('/api/permissions/roles.manage/holders');
    expect(holders.body.roles).toEqual([
      { id: await kit3.systemRole(), name: 'Administrador', people: expect.any(Array) },
    ]);
    expect(holders.body.grantedBy).toEqual(holders.body.roles[0].people);
    expect(holders.body.roles[0].people).toContain('Lucía');
    expect(holders.body.roles[0].people).toContain('Sin nombre');
    expect(JSON.stringify(holders.body)).not.toContain('@');
    expect((await named.device.request('/api/permissions/sales.sell/holders')).status).toBe(404);
    await kit3.server.close();
  });
});
