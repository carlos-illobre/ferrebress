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
  });

  it('las de las personas', async () => {
    for (let i = 0; i < 3; i++) await kit.linkedPhone();
    const counts: Record<string, number> = {};
    counts.list = await count('/api/users');
    const person = (await admin.request('/api/users', { email: 'nueva@example.com' })).body.person;
    counts.authorize = await count('/api/users', { email: 'otra@example.com' });
    counts.rename = await count(`/api/users/${person.id}`, { version: 1, name: 'Nueva' });
    counts.email = await count(`/api/users/${person.id}`, { version: 2, email: 'n@example.com' });
    counts.deactivate = await count(`/api/users/${person.id}/deactivate`, { version: 3 });
    counts.activate = await count(`/api/users/${person.id}/activate`, { version: 4 });
    counts.remove = await count(`/api/users/${person.id}/delete`, { version: 5 });
    // Las escrituras con aviso abren una transacción: el comienzo y la confirmación cuentan.
    expect(counts).toEqual({
      list: 3,
      authorize: 1,
      rename: 3,
      email: 1,
      deactivate: 6,
      activate: 1,
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
    expect(counts).toEqual({ access: 2, lost: 3, lostAgain: 2, cut: 3, close: 1, closeAll: 1 });
  });
});
