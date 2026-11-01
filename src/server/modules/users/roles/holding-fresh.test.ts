import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRolesKit, type RolesKit } from '../../../testing/users/roles-kit.ts';

describe('guardar un rol con sus personas, en un servidor recién instalado', () => {
  let kit: RolesKit;
  beforeAll(async () => {
    kit = await createRolesKit();
  });
  afterAll(() => kit.server.close());

  const roleOf = async (id: string) =>
    (await kit.admin.request('/api/roles')).body.roles.find(
      (role: { id: string }) => role.id === id,
    );
  const save = async (id: string, body: Record<string, unknown>, by = kit.admin) =>
    by.request(`/api/roles/${id}`, { version: (await roleOf(id)).version, ...body });

  it('seguridad 47: las líneas de un guardado dicen su rol y comparten su id; el rechazo dice de quién', async () => {
    const view = await kit.role('Auditado', ['users.view']);
    const pia = await kit.person([view]);
    const quino = await kit.person([view]);
    const target = await kit.role('Destino', ['offline.work']);
    expect((await save(target, { give: [pia.id, quino.id] })).status).toBe(200);
    const lines = kit.audited('user.roles-changed').slice(-2);
    expect(lines.map((one) => one.data?.roleId)).toEqual([target, target]);
    expect(lines[0]?.data?.save).toBe(lines[1]?.data?.save);
    const { version } = await kit.row(quino.id);
    await kit.admin.request(`/api/users/${quino.id}/deactivate`, { version });
    const other = await kit.role('Otro destino', ['offline.work']);
    await save(other, { give: [quino.id] });
    expect(kit.audited('users.rejected').at(-1)?.data).toMatchObject({
      reason: 'person-inactive',
      userId: quino.id,
    });
  });

  it('seguridad 49: sacarle el rol al último que administra no se guarda, ni el nombre del mismo pedido', async () => {
    const managing = await kit.role('Administra personas', ['users.manage']);
    const roles = await kit.role('Arma roles', ['roles.manage']);
    const view = await kit.role('Solo ve', ['users.view']);
    const nico = await kit.person([managing, view]);
    const boss = await kit.person([roles]);
    const system = await kit.systemRole();
    const others = ['offline.work', 'roles.manage', 'users.cut', 'users.view'];
    expect((await save(system, { permissions: others }, boss.device)).status).toBe(200);
    const reply = await save(managing, { name: 'Renombrado', take: [nico.id] }, boss.device);
    expect(reply.body).toEqual({ error: 'last-administrator' });
    expect((await roleOf(managing)).name).toBe('Administra personas');
  });
});
