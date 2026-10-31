// «Trabajar sin conexión» es un permiso (02 · R7.1, 15 · R1.2; diseño de 02, § 17): sin él, el celular
// no lo ofrece y el servidor no confirma una entrada sin conexión. Vale desde el próximo pedido.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testConfig } from '../../../testing/config.ts';
import { createAuthenticator } from '../../../testing/sign-in/authenticator.ts';
import { androidPhone, createOfflineKit } from '../../../testing/sign-in/offline-kit.ts';
import { createDevice } from '../../../testing/sign-in/sign-in-server.ts';

describe('trabajar sin conexión, con su permiso', () => {
  let kit: Awaited<ReturnType<typeof createOfflineKit>>;
  beforeAll(async () => {
    kit = await createOfflineKit();
  });
  afterAll(() => kit.server.close());

  it('users-E52: sin el permiso, el celular no lo ofrece y la entrada sin conexión no se confirma', async () => {
    const linked = await kit.linkedPhone();
    expect((await linked.phone.request('/api/start')).body.person.offline).toBe(true);
    const entry = await kit.offlineEntry(linked);
    await kit.onlyWith(linked.userId, ['users.view']);
    const start = (await linked.phone.request('/api/start')).body.person;
    expect(start).toMatchObject({ permissions: ['users.view'] });
    expect(start.offline).toBeUndefined();
    linked.phone.cookie = '';
    expect((await kit.send(linked, entry)).body.error).toBe('offline-not-confirmed');
    expect(await kit.rowOf(entry.id)).toEqual({ result: 'rejected', reason: 'not-allowed' });
  });

  it('users-E52: vincular la huella sin el permiso no deja prender «Trabajar sin conexión»', async () => {
    const claims = await kit.newAccount();
    const phone = createDevice(kit.server, { userAgent: androidPhone });
    const userId = (await phone.signInWithGoogle(claims)).body.person.userId as string;
    await kit.onlyWith(userId, ['users.view']);
    const authenticator = createAuthenticator(testConfig.PUBLIC_ORIGIN);
    const options = await phone.request('/api/passkeys/options', {});
    const response = authenticator.create(options.body);
    expect((await phone.request('/api/passkeys', { response })).body).toEqual({
      ok: true,
      offline: false,
    });
  });
});
