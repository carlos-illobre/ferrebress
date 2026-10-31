// Cuántas consultas a la base hace cada ruta de Usuarios (diseño de 02, § 4), con la sesión del
// pedido ya en memoria: que no aparezca una de más, ni una dentro de un bucle por persona.
import { beforeAll, describe, expect, it } from 'vitest';
import { createOfflineKit } from '../../testing/sign-in/offline-kit.ts';
import { createDevice } from '../../testing/sign-in/sign-in-server.ts';

type Kit = Awaited<ReturnType<typeof createOfflineKit>>;

describe('las consultas de cada ruta de Usuarios', () => {
  let kit: Kit;
  let admin: ReturnType<typeof createDevice>;
  const count = (path: string, body?: unknown) =>
    kit.server.countQueries(async () => {
      const reply = await admin.request(path, body);
      expect(reply.status).toBe(200);
    });

  beforeAll(async () => {
    kit = await createOfflineKit();
    admin = createDevice(kit.server);
    await admin.signInWithGoogle({ sub: 'sub-admin', email: 'admin@example.com' });
    await admin.request('/api/start');
    // Sus permisos, ya en memoria (diseño de 02, § 17).
    await admin.request('/api/users');
  });

  it('las de las personas', async () => {
    for (let i = 0; i < 3; i++) await kit.linkedPhone();
    const counts: Record<string, number> = {};
    counts.list = await count('/api/users');
    const roles = [(await admin.request('/api/users')).body.roles[0].id];
    const person = (await admin.request('/api/users', { email: 'nueva@example.com', roles })).body
      .person;
    counts.authorize = await count('/api/users', { email: 'otra@example.com', roles });
    counts.rename = await count(`/api/users/${person.id}`, { version: 1, name: 'Nueva' });
    counts.email = await count(`/api/users/${person.id}`, { version: 2, email: 'n@example.com' });
    counts.deactivate = await count(`/api/users/${person.id}/deactivate`, { version: 3 });
    counts.activate = await count(`/api/users/${person.id}/activate`, { version: 4 });
    counts.remove = await count(`/api/users/${person.id}/delete`, { version: 5 });
    // Las escrituras con aviso abren una transacción: el comienzo y la confirmación cuentan.
    // La lista, el correo, la baja y el alta suman la de R7.11: los permisos de las personas.
    expect(counts).toEqual({
      list: 5,
      authorize: 1,
      rename: 3,
      email: 2,
      deactivate: 8,
      activate: 2,
      remove: 1,
    });
  });

  it('las de las sesiones y los celulares', async () => {
    const linked = await kit.linkedPhone();
    const counts: Record<string, number> = {};
    counts.access = await count(`/api/users/${linked.userId}/access`);
    counts.lost = await count('/api/lost-phones');
    // Los nombres ya están en memoria.
    counts.lostAgain = await count('/api/lost-phones');
    const { sessions, phones } = (await admin.request(`/api/users/${linked.userId}/access`)).body;
    counts.cut = await count(`/api/users/${linked.userId}/phones/${phones[0].id}/cut`, {
      from: 'card',
    });
    counts.close = await count(`/api/users/${linked.userId}/sessions/${sessions[0].id}/close`, {});
    counts.closeAll = await count(`/api/users/${linked.userId}/sessions/close`, {});
    // Cortar y «Se perdió un celular» suman la de R7.11: los permisos de esas personas.
    expect(counts).toEqual({ access: 2, lost: 4, lostAgain: 3, cut: 4, close: 3, closeAll: 2 });
  });
});
