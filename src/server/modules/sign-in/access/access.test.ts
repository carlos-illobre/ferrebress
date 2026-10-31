// Lo que Usuarios ve y corta de las sesiones y las huellas de cada persona (02 · R5; diseño de 02,
// §§ 4 y 6), con un celular con huella de verdad (la huella de prueba).
import { beforeAll, describe, expect, it } from 'vitest';
import { createOfflineKit } from '../../../testing/sign-in/offline-kit.ts';
import { createDevice } from '../../../testing/sign-in/sign-in-server.ts';

type Kit = Awaited<ReturnType<typeof createOfflineKit>>;

describe('las sesiones y los celulares, desde Usuarios', () => {
  let kit: Kit;
  let admin: ReturnType<typeof createDevice>;
  let adminId: string;

  beforeAll(async () => {
    kit = await createOfflineKit();
    admin = createDevice(kit.server);
    const entered = await admin.signInWithGoogle({ sub: 'sub-admin', email: 'admin@example.com' });
    adminId = entered.body.person.userId;
  });

  const rowOf = async (userId: string) =>
    (await admin.request('/api/users')).body.people.find((p: { id: string }) => p.id === userId);

  it('users-E21: la tarjeta cerrada dice cuántas tiene; abierta, cada sesión con cómo y cuándo entró', async () => {
    const linked = await kit.linkedPhone();
    const computer = createDevice(kit.server, { ip: '181.9.9.9' });
    await computer.signInWithGoogle(linked.claims);
    expect(await rowOf(linked.userId)).toMatchObject({ sessions: 2, phones: 1 });
    const access = (await admin.request(`/api/users/${linked.userId}/access`)).body;
    expect(access.sessions).toHaveLength(2);
    expect(access.sessions[0]).toMatchObject({
      way: 'google',
      deviceLabel: expect.any(String),
      createdAt: expect.any(Number),
    });
    expect(access.phones).toEqual([
      expect.objectContaining({ deviceLabel: 'Chrome en Android', id: expect.any(String) }),
    ]);
    // Nunca sale el identificador del dispositivo ni el de la huella (02, § 9).
    expect(JSON.stringify(access)).not.toContain(linked.phone.id);
  });

  it('users-E22: en la propia no figuran la sesión que se usa ni los celulares propios', async () => {
    const other = createDevice(kit.server, { ip: '181.8.8.8' });
    await other.signInWithGoogle({ sub: 'sub-admin', email: 'admin@example.com' });
    const access = (await admin.request(`/api/users/${adminId}/access`)).body;
    expect(access.sessions).toHaveLength(1);
    expect(access.phones).toEqual([]);
    expect(await rowOf(adminId)).toMatchObject({ sessions: 1, phones: 0 });
  });

  it('users-E23, E25: «Cerrar» y «Cerrar todas»; el dispositivo vuelve a la entrada con su próximo pedido', async () => {
    const linked = await kit.linkedPhone();
    const computer = createDevice(kit.server, { ip: '181.7.7.7' });
    await computer.signInWithGoogle(linked.claims);
    const [first] = (await admin.request(`/api/users/${linked.userId}/access`)).body.sessions;
    const closed = await admin.request(
      `/api/users/${linked.userId}/sessions/${first.id}/close`,
      {},
    );
    expect(closed.body).toEqual({ closed: 1 });
    const all = await admin.request(`/api/users/${linked.userId}/sessions/close`, {});
    expect(all.body).toEqual({ closed: 1 });
    for (const device of [linked.phone, computer]) {
      expect(await device.request('/api/users')).toMatchObject({
        status: 401,
        body: { error: 'session-closed', reason: 'revoked' },
      });
    }
    // Lo que ya estaba cerrado no es un error: no había nada que cortar.
    expect((await admin.request(`/api/users/${linked.userId}/sessions/close`, {})).body).toEqual({
      closed: 0,
    });
  });

  it('users-E26, E27: «Quitar» la huella cierra la sesión de ese celular y ya no entra ni sin conexión', async () => {
    const linked = await kit.linkedPhone();
    const [phone] = (await admin.request(`/api/users/${linked.userId}/access`)).body.phones;
    const cut = await admin.request(`/api/users/${linked.userId}/phones/${phone.id}/cut`, {
      from: 'card',
    });
    expect(cut.body).toEqual({ sessions: 1, passkey: true });
    expect((await linked.phone.request('/api/start')).body.person).toBeUndefined();
    const entry = await kit.offlineEntry(linked);
    expect((await kit.send(linked, entry)).body.error).toBe('offline-not-confirmed');
    // Al volver a entrar con Google, se le ofrece vincular la huella otra vez (E19).
    const again = await linked.phone.signInWithGoogle(linked.claims);
    expect(again.body).toMatchObject({ offerPasskey: true });
    expect(again.body.person.offline).toBeUndefined();
  });

  it('users-E31, E32: «Se perdió un celular» lista a quien tiene celulares y corta uno solo', async () => {
    const linked = await kit.linkedPhone();
    const second = createDevice(kit.server, {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148 Safari/604.1',
      ip: '181.6.6.6',
    });
    await second.signInWithGoogle(linked.claims);
    const lost = (await admin.request('/api/lost-phones')).body.people;
    const person = lost.find((p: { userId: string }) => p.userId === linked.userId);
    expect(person.phones).toHaveLength(2);
    const android = person.phones.find((p: { passkey: boolean }) => p.passkey);
    const cut = await admin.request(`/api/users/${linked.userId}/phones/${android.id}/cut`, {
      from: 'lost',
    });
    expect(cut.body).toEqual({ sessions: 1, passkey: true });
    expect((await second.request('/api/start')).body.person).toBeDefined();
    expect(kit.server.platform.audit.read(2026).at(-1)).toMatchObject({
      type: 'phone.cut',
      userId: adminId,
      data: { targetUserId: linked.userId, sessions: 1, passkey: true },
    });
    // El otro, sin huella, se corta por su sesión.
    const iphone = person.phones.find((p: { passkey: boolean }) => !p.passkey);
    expect(
      (
        await admin.request(`/api/users/${linked.userId}/phones/${iphone.id}/cut`, {
          from: 'lost',
        })
      ).body,
    ).toEqual({ sessions: 1, passkey: false });
    expect((await second.request('/api/start')).body.person).toBeUndefined();
  });

  it('el celular desde el que se pide no se corta, y uno de otra persona da 404', async () => {
    const linked = await kit.linkedPhone();
    const [phone] = (await linked.phone.request(`/api/users/${adminId}/access`)).body.phones;
    expect(phone).toBeUndefined();
    const own = (await linked.phone.request('/api/lost-phones')).body.people;
    expect(own.some((p: { userId: string }) => p.userId === linked.userId)).toBe(false);
    const [mine] = (await admin.request(`/api/users/${linked.userId}/access`)).body.phones;
    expect(
      (
        await linked.phone.request(`/api/users/${linked.userId}/phones/${mine.id}/cut`, {
          from: 'card',
        })
      ).body.error,
    ).toBe('self');
    expect(
      (await admin.request(`/api/users/${adminId}/phones/${mine.id}/cut`, { from: 'card' })).status,
    ).toBe(404);
  });

  it('users-R3.8: confirmar con la huella propia sirve; con otra cuenta de Google o la huella de otra persona, no', async () => {
    const linked = await kit.linkedPhone();
    const options = await linked.phone.request('/api/session/confirm/passkey/options', {});
    const response = linked.authenticator.get({ challenge: options.body.challenge });
    expect((await linked.phone.request('/api/session/confirm/passkey', { response })).body).toEqual(
      { ok: true },
    );
    const [used] = (await admin.request(`/api/users/${linked.userId}/access`)).body.phones;
    expect(used.lastUsedAt).toEqual(expect.any(Number));
    // Una firma que no es de la huella no confirma.
    const again = await linked.phone.request('/api/session/confirm/passkey/options', {});
    const forged = linked.authenticator.get({ challenge: again.body.challenge });
    forged.response.signature = response.response.signature;
    expect(
      (await linked.phone.request('/api/session/confirm/passkey', { response: forged })).status,
    ).not.toBe(200);
    // La misma firma, pedida desde la sesión de otra persona: el desafío no es de esa sesión.
    const other = await admin.request('/api/session/confirm/passkey/options', {});
    const foreign = linked.authenticator.get({ challenge: other.body.challenge });
    expect(
      await admin.request('/api/session/confirm/passkey', { response: foreign }),
    ).toMatchObject({ status: 403, body: { error: 'not-authorized' } });
    const start = await admin.request('/api/start');
    const credential = await kit.server.google.credential({
      nonce: start.body.googleNonce,
      ...linked.claims,
    });
    expect((await admin.request('/api/session/confirm/google', { credential })).status).toBe(403);
    expect(
      (await admin.request('/api/session/confirm/google', { credential: 'no-es-un-pase' })).status,
    ).toBe(403);
    // Sin una sesión, nada; y más desafíos que los que da por dirección, tampoco.
    expect((await createDevice(kit.server).request('/api/users')).body).toEqual({
      error: 'session-closed',
      reason: 'unknown',
    });
    const statuses = [];
    for (let i = 0; i < 11; i++)
      statuses.push(
        (await linked.phone.request('/api/session/confirm/passkey/options', {})).status,
      );
    expect(statuses.at(-1)).toBe(429);
    expect(kit.server.platform.audit.read(2026).at(-1)).toMatchObject({
      type: 'session.confirm-rejected',
      userId: adminId,
      data: { method: 'google' },
    });
  });

  it('una cookie que no es de nadie: pasado el límite, ni se consulta la base', async () => {
    const stranger = createDevice(kit.server, { ip: '181.5.5.5' });
    stranger.cookie = '__Host-session=inventada';
    for (let i = 0; i < 30; i++) expect((await stranger.request('/api/users')).status).toBe(401);
    stranger.cookie = '__Host-session=inventada';
    const queries = await kit.server.countQueries(async () => {
      expect((await stranger.request('/api/users')).status).toBe(429);
    });
    expect(queries).toBe(0);
  });
});
