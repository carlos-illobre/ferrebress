import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRolesKit, type RolesKit } from '../../../testing/users/roles-kit.ts';

describe('guardar un rol con sus personas, todo junto (02 · R7.13)', () => {
  let kit: RolesKit;
  beforeAll(async () => {
    kit = await createRolesKit();
  });
  afterAll(() => kit.server.close());

  const roleOf = async (id: string) =>
    (await kit.admin.request('/api/roles')).body.roles.find(
      (role: { id: string }) => role.id === id,
    );
  const save = async (id: string, body: Record<string, unknown>) =>
    kit.admin.request(`/api/roles/${id}`, { version: (await roleOf(id)).version, ...body });
  const missing = '00000000-0000-7000-8000-000000000000';

  it('users-E63: crear con personas deja el rol creado y a esas personas con él', async () => {
    const view = await kit.role('Base', ['users.view']);
    const ana = await kit.person([view]);
    const created = await kit.admin.request('/api/roles', {
      name: 'Encargado',
      permissions: ['users.cut'],
      give: [ana.id],
    });
    expect(created.status).toBe(200);
    const id = created.body.role.id;
    expect((await kit.row(ana.id)).roleIds.sort()).toEqual([view, id].sort());
    expect(kit.audited('user.roles-changed').at(-1)).toMatchObject({
      targets: [
        { kind: 'person', id: ana.id },
        { kind: 'role', id },
      ],
      changes: {
        roles: { before: ['Base'], after: expect.arrayContaining(['Base', 'Encargado']) },
      },
    });
  });

  it('users-E62: el nombre, los permisos y las personas en un pedido; confirmar una sola vez', async () => {
    const view = await kit.role('Ve todo', ['users.view']);
    const extra = await kit.role('Extra', ['offline.work']);
    const beto = await kit.person([view, extra]);
    const caro = await kit.person([view]);
    const before = (await roleOf(extra)).version;
    kit.later();
    const body = {
      name: 'Extra plus',
      permissions: ['offline.work', 'users.view'],
      give: [caro.id],
      take: [beto.id],
    };
    expect((await save(extra, body)).body).toEqual({ error: 'confirm-first' });
    expect((await roleOf(extra)).name).toBe('Extra');
    expect((await kit.row(caro.id)).roleIds).toEqual([view]);
    await kit.reconfirm();
    const saved = await save(extra, body);
    expect(saved.status).toBe(200);
    expect(saved.body.role).toMatchObject({ name: 'Extra plus', version: before + 1 });
    expect((await kit.row(caro.id)).roleIds.sort()).toEqual([view, extra].sort());
    expect((await kit.row(beto.id)).roleIds).toEqual([view]);
    const changes = kit.audited('user.roles-changed').slice(-2);
    expect(changes.map((one) => one.targets?.[0]?.id).sort()).toEqual([beto.id, caro.id].sort());
    expect(kit.audited('role.changed').at(-1)?.targets).toEqual([
      { kind: 'role', id: extra, name: 'Extra plus' },
    ]);
  });

  it('users-E62: cambiar solo las personas no sube la versión del rol ni deja su línea', async () => {
    const view = await kit.role('Solo mira', ['users.view']);
    const dani = await kit.person([view]);
    const { version } = await roleOf(view);
    const lines = kit.audited('role.changed').length;
    expect((await save(view, { take: [], give: [dani.id] })).status).toBe(200);
    expect((await roleOf(view)).version).toBe(version);
    expect(kit.audited('role.changed').length).toBe(lines);
  });

  it('users-E62: dar a quien ya lo tiene o sacar a quien no lo tiene no cambia a esa persona', async () => {
    const view = await kit.role('Mirada', ['users.view']);
    const other = await kit.role('Otra cosa', ['offline.work']);
    const eva = await kit.person([view]);
    const { version } = await kit.row(eva.id);
    const lines = kit.audited('user.roles-changed').length;
    expect((await save(view, { give: [eva.id] })).status).toBe(200);
    expect((await save(other, { take: [eva.id] })).status).toBe(200);
    expect((await kit.row(eva.id)).version).toBe(version);
    expect(kit.audited('user.roles-changed').length).toBe(lines);
  });

  it('users-E65: quien se quedaría sin roles no deja guardar nada, y dice quién', async () => {
    const only = await kit.role('Único', ['users.view']);
    const fede = await kit.person([only]);
    const reply = await save(only, { name: 'Único cambiado', take: [fede.id] });
    expect(reply.status).toBe(400);
    expect(reply.body).toEqual({ error: 'no-roles', userId: fede.id });
    expect((await roleOf(only)).name).toBe('Único');
    expect((await kit.row(fede.id)).roleIds).toEqual([only]);
  });

  it('users-E65: una persona dada de baja o que no existe no deja guardar nada, y dice cuál', async () => {
    const view = await kit.role('Para dar', ['users.view']);
    const gus = await kit.person([view]);
    const { version } = await kit.row(gus.id);
    await kit.admin.request(`/api/users/${gus.id}/deactivate`, { version });
    const fresh = await kit.role('Nuevito', ['offline.work']);
    expect((await save(fresh, { name: 'Otro nombre', give: [gus.id] })).body).toEqual({
      error: 'person-inactive',
      userId: gus.id,
    });
    expect((await save(fresh, { give: [missing] })).body).toEqual({
      error: 'person-missing',
      userId: missing,
    });
    expect((await roleOf(fresh)).name).toBe('Nuevito');
    const creating = { name: 'No va', permissions: ['users.view'], give: [missing] };
    expect((await kit.admin.request('/api/roles', creating)).status).toBe(409);
    const names = (await kit.admin.request('/api/roles')).body.roles.map(
      (role: { name: string }) => role.name,
    );
    expect(names).not.toContain('No va');
  });

  it('users-E65: un nombre repetido no da el rol a nadie', async () => {
    const view = await kit.role('Repetible', ['users.view']);
    const other = await kit.role('Distinto', ['offline.work']);
    const hugo = await kit.person([view]);
    expect((await save(other, { name: 'repetible', give: [hugo.id] })).body).toEqual({
      error: 'role-name-taken',
    });
    expect((await kit.row(hugo.id)).roleIds).toEqual([view]);
  });

  it('users-E56, E65: sacarse a sí mismo «Administrar roles» no se guarda y dice qué permiso', async () => {
    const system = await kit.systemRole();
    const view = await kit.role('Del admin', ['users.view']);
    await kit.setRoles(kit.adminId, [system, view]);
    expect((await save(system, { take: [kit.adminId] })).body).toEqual({
      error: 'self',
      permission: 'roles.manage',
    });
    expect((await kit.row(kit.adminId)).roleIds).toContain(system);
  });

  it('lo que entra: el mismo id en las dos listas, repetidos o de más, no pasan', async () => {
    const view = await kit.role('Listas', ['users.view']);
    const ivan = await kit.person([view]);
    for (const body of [
      { give: [ivan.id], take: [ivan.id] },
      { give: [ivan.id, ivan.id] },
      { give: Array.from({ length: 201 }, () => crypto.randomUUID()) },
      { give: ['no-es-un-id'] },
    ])
      expect((await save(view, body)).status).toBe(400);
  });

  it('users-E60: la lista de roles ya no dice quiénes los tienen: sale de la de Usuarios', async () => {
    const roles = (await kit.admin.request('/api/roles')).body.roles;
    expect(roles.every((role: object) => !('holders' in role))).toBe(true);
  });

  it('users-E50: dar el rol con la confirmación vieja la pide; con una versión vieja, otro lo cambió', async () => {
    const view = await kit.role('Para confirmar', ['users.view']);
    const juli = await kit.person([view]);
    const other = await kit.role('Lo de Juli', ['offline.work']);
    const { version } = await roleOf(other);
    kit.later();
    expect((await save(other, { give: [juli.id] })).body).toEqual({ error: 'confirm-first' });
    expect((await save(other, { take: [] })).status).toBe(200);
    await kit.reconfirm();
    const stale = await kit.admin.request(`/api/roles/${other}`, {
      version: version + 5,
      give: [juli.id],
    });
    expect(stale.body).toEqual({ error: 'changed' });
  });

  it('quien ya tiene 50 roles no recibe uno más', async () => {
    const view = await kit.role('Cincuenta', ['users.view']);
    const kai = await kit.person([view]);
    await sql`insert into users.roles (id, name)
      select gen_random_uuid(), 'Relleno ' || n from generate_series(1, 49) as n`.execute(
      kit.server.platform.db,
    );
    await sql`insert into users.user_roles (user_id, role_id)
      select ${kai.id}::uuid, id from users.roles where name like 'Relleno %'`.execute(
      kit.server.platform.db,
    );
    const extra = await kit.role('El 51', ['offline.work']);
    expect((await save(extra, { give: [kai.id] })).body).toEqual({
      error: 'too-many-roles',
      userId: kai.id,
    });
    await sql`delete from users.user_roles where role_id in (select id from users.roles where name like 'Relleno %')`.execute(
      kit.server.platform.db,
    );
    await sql`delete from users.roles where name like 'Relleno %'`.execute(kit.server.platform.db);
  });

  it('users-E56: sacarse a sí mismo solo «Administrar personas» dice ese permiso', async () => {
    const system = await kit.systemRole();
    const roles = await kit.role('Solo roles', ['roles.manage']);
    const people = await kit.role('Solo personas', ['users.manage']);
    await kit.setRoles(kit.adminId, [system, roles, people]);
    const { version } = await roleOf(system);
    await kit.admin.request(`/api/roles/${system}`, {
      version,
      permissions: ['roles.manage', 'users.view', 'users.cut', 'offline.work'],
    });
    expect((await save(people, { take: [kit.adminId] })).body).toEqual({
      error: 'self',
      permission: 'users.manage',
    });
  });

  it('seguridad 49: con la confirmación vieja, sacar a alguien o dar a quien ya lo tiene no la piden', async () => {
    const view = await kit.role('Viejo', ['users.view']);
    const extra = await kit.role('Extra viejo', ['offline.work']);
    const lola = await kit.person([view, extra]);
    const memo = await kit.person([view]);
    kit.later();
    expect((await save(extra, { take: [lola.id] })).status).toBe(200);
    expect((await save(view, { give: [memo.id] })).status).toBe(200);
    expect((await kit.row(lola.id)).roleIds).toEqual([view]);
    await kit.reconfirm();
  });

  it('seguridad 49: al crear no se saca a nadie', async () => {
    const view = await kit.role('Para sacar', ['users.view']);
    const ofe = await kit.person([view]);
    const body = { name: 'Con take', permissions: ['users.view'], take: [ofe.id] };
    expect((await kit.admin.request('/api/roles', body)).status).toBe(400);
  });
});
