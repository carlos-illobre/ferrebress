// Las sesiones y los celulares de Usuarios con sus permisos (02 · R5, R7.1, R7.11; diseño de 02,
// § 18): verlas pide «Ver las personas»; cerrar, cortar y «Se perdió un celular», «Cortar sesiones y
// huellas», y nunca sobre quien tiene más. La persona de /api/start trae lo nuevo desde el próximo
// pedido (R7.6).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { androidPhone } from '../../../testing/sign-in/offline-kit.ts';
import { createDevice } from '../../../testing/sign-in/sign-in-server.ts';
import { createRolesKit, type RolesKit } from '../../../testing/users/roles-kit.ts';

const anyId = '00000000-0000-7000-8000-000000000999';

describe('las sesiones y los celulares, con permisos', () => {
  let kit: RolesKit;
  beforeAll(async () => {
    kit = await createRolesKit();
  });
  afterAll(() => kit.server.close());

  it('users-E46, E47: sin «Cortar sesiones y huellas» se ven, pero no se cierran ni se cortan', async () => {
    // Todavía sin celulares.
    expect((await kit.admin.request('/api/lost-phones')).body).toEqual({ people: [] });
    const viewer = await kit.person([await kit.role('Solo mira', ['users.view'])]);
    expect((await viewer.device.request(`/api/users/${kit.adminId}/access`)).status).toBe(200);
    for (const [path, body] of [
      [`/api/users/${kit.adminId}/sessions/close`, {}],
      [`/api/users/${kit.adminId}/sessions/${anyId}/close`, {}],
      [`/api/users/${kit.adminId}/phones/${anyId}/cut`, { from: 'card' }],
    ] as const)
      expect((await viewer.device.request(path, body)).body).toEqual({
        error: 'forbidden',
        permission: 'users.cut',
      });
    expect((await viewer.device.request('/api/lost-phones')).status).toBe(403);
    const none = await kit.person([await kit.role('Nada de Usuarios', ['offline.work'])]);
    expect((await none.device.request(`/api/users/${kit.adminId}/access`)).body).toEqual({
      error: 'forbidden',
      permission: 'users.view',
    });
  });

  it('users-E58: a quien tiene más no se le cierran sesiones ni se le corta un celular, y no aparece en «Se perdió un celular»', async () => {
    const cutter = await kit.person([await kit.role('Corta', ['users.cut'])]);
    const below = await kit.person([await kit.role('Ve', ['users.view'])], { signIn: false });
    const phone = createDevice(kit.server, { userAgent: androidPhone });
    await phone.signInWithGoogle({ sub: 'sub-celular-ve', email: below.email });
    const adminPhone = createDevice(kit.server, { userAgent: androidPhone });
    await adminPhone.signInWithGoogle({ sub: 'sub-admin', email: 'admin@example.com' });
    for (const [path, body] of [
      [`/api/users/${kit.adminId}/sessions/close`, {}],
      [`/api/users/${kit.adminId}/sessions/${anyId}/close`, {}],
      [`/api/users/${kit.adminId}/phones/${anyId}/cut`, { from: 'lost' }],
    ] as const)
      expect((await cutter.device.request(path, body)).body).toEqual({ error: 'outranked' });
    const cut = await cutter.device.request(`/api/users/${below.id}/phones/${anyId}/cut`, {
      from: 'card',
    });
    expect(cut.body).toEqual({ error: 'not-found' });
    const { people } = (await cutter.device.request('/api/lost-phones')).body;
    expect(people.map((one: { userId: string }) => one.userId)).toEqual([below.id]);
    const all = (await kit.admin.request('/api/lost-phones')).body.people;
    expect(all.map((one: { userId: string }) => one.userId)).toContain(kit.adminId);
  });

  it('users-E48: con su próximo pedido, /api/start trae los roles y permisos nuevos y quién se los cambió', async () => {
    const view = await kit.role('Mirar', ['users.view']);
    const cut = await kit.role('Cortar', ['users.cut']);
    const ana = await kit.person([view]);
    expect((await ana.device.request('/api/start')).body.person).toMatchObject({
      roles: [{ id: view, name: 'Mirar' }],
      permissions: ['users.view'],
      rolesChangedBy: null,
      rolesChangedAt: null,
    });
    await kit.setRoles(ana.id, [cut, view]);
    expect((await ana.device.request('/api/start')).body.person).toMatchObject({
      roles: [
        { id: cut, name: 'Cortar' },
        { id: view, name: 'Mirar' },
      ],
      permissions: ['users.cut', 'users.view'],
      rolesChangedBy: 'Ana Gómez',
      rolesChangedAt: expect.any(Number),
    });
    const { version } = (await kit.admin.request('/api/roles')).body.roles.find(
      (role: { id: string }) => role.id === cut,
    );
    await kit.admin.request(`/api/roles/${cut}`, { version, name: 'Cortar todo' });
    expect((await ana.device.request('/api/start')).body.person.roles[0].name).toBe('Cortar todo');
  });
});
