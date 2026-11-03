// Lo que se anota y cómo se ve (05 · R1, R2, R3): lo que no se guardó no figura, los rechazos van en
// ámbar con quién fue, la hora es la del servidor y quien mira ve cada acción entera. Y cuántas
// consultas le cuesta cada pedido.
import { DatabaseSync } from 'node:sqlite';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createDevice } from '../../testing/sign-in/sign-in-server.ts';
import { createRolesKit, minutes, type RolesKit } from '../../testing/users/roles-kit.ts';

describe('Quién hizo qué: lo que se anota', () => {
  let kit: RolesKit;
  let viewer: Awaited<ReturnType<RolesKit['person']>>;
  let other: Awaited<ReturnType<RolesKit['person']>>;

  beforeAll(async () => {
    kit = await createRolesKit();
    viewer = await kit.person([await kit.role('Mira el registro', ['audit-log.view'])]);
    other = await kit.person([await kit.role('Solo personas', ['users.view'])]);
  });

  it('audit-log-E02: lo que no se pudo guardar no figura como hecho', async () => {
    const before = kit.audited('role.created').length;
    const taken = await kit.admin.request('/api/roles', {
      name: 'Mira el registro',
      permissions: ['users.view'],
    });
    expect(taken.status).toBe(409);
    expect(kit.audited('role.created')).toHaveLength(before);
  });

  it('audit-log-E03: un correo no autorizado queda en ámbar, con el correo y sin nadie adentro', async () => {
    await createDevice(kit.server).signInWithGoogle({ sub: 'sub-x', email: 'nadie@example.com' });
    expect(kit.audited('sign-in.rejected').at(-1)).toMatchObject({
      tone: 'amber',
      actor: { kind: 'outsider', email: 'nadie@example.com' },
    });
    const listed = await kit.admin.request('/api/audit-log?type=sign-in.rejected');
    expect(listed.body.events[0]).toMatchObject({
      tone: 'amber',
      actor: { kind: 'outsider', email: 'nadie@example.com' },
    });
  });

  it('audit-log-E04: un pedido sin el permiso queda en ámbar, con quién fue y qué le faltó', async () => {
    expect((await other.device.request('/api/roles')).status).toBe(403);
    expect(kit.audited('permission.denied').at(-1)).toMatchObject({
      tone: 'amber',
      actor: { kind: 'person', userId: other.id },
      data: { permission: 'roles.manage' },
    });
  });

  it('audit-log-E10: con conexión, la hora es la del servidor, sin la del dispositivo', async () => {
    const created = kit.audited('role.created').at(-1);
    expect(created?.at).toEqual(new Date('2026-10-31T09:00:00Z'));
    expect(created?.deviceTime).toBeUndefined();
    const listed = await kit.admin.request('/api/audit-log?type=role.created');
    expect(listed.body.events[0].at).toBe('2026-10-31T09:00:00.000Z');
    expect(listed.body.events[0].deviceTime).toBeUndefined();
  });

  it('audit-log-E16: quien solo puede ver Quién hizo qué ve entera una acción de Roles', async () => {
    const query = '/api/audit-log?type=role.created';
    const seen = (await viewer.device.request(query)).body.events;
    expect(seen.length).toBeGreaterThan(0);
    expect(seen).toEqual((await kit.admin.request(query)).body.events);
    expect(JSON.stringify(seen)).toContain('Mira el registro');
  });

  it('metas: las consultas de un pedido no crecen con los días que muestra', async () => {
    // Acciones en dos días de la semana.
    kit.later(minutes(24 * 60));
    await kit.reconfirm();
    await kit.role('Del otro día', ['users.view']);
    const prepared = vi.spyOn(DatabaseSync.prototype, 'prepare');
    const asked = async (path: string) => {
      await kit.admin.request(path);
      prepared.mockClear();
      await kit.admin.request(path);
      return prepared.mock.calls.filter(([sql]) => /from events/.test(sql)).length;
    };
    const oneDay = await asked('/api/audit-log?from=2026-10-31&until=2026-10-31&summary=1');
    const week = await asked('/api/audit-log?range=week&summary=1');
    const day = await asked('/api/audit-log/day?date=2026-10-31');
    prepared.mockRestore();
    // Una por archivo y por pregunta: contar, la página, los días de la página y el resumen; en la
    // cinta, la semana entera es una sola, y la página del día no vuelve a contar lo que ya contó.
    expect(
      Object.keys((await kit.admin.request('/api/audit-log?range=week')).body.days).length,
    ).toBeGreaterThan(1);
    expect(week).toBe(oneDay);
    expect(day).toBe(3);
  });
});
