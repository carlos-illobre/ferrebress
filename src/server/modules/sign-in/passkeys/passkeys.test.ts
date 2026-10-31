import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testConfig } from '../../../testing/config.ts';
import { createAuthenticator } from '../../../testing/sign-in/authenticator.ts';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../../testing/sign-in/sign-in-server.ts';

const androidPhone =
  'Mozilla/5.0 (Linux; Android 14; moto e13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36';
const admin = { sub: 'sub-admin', email: 'admin@example.com' };
const minutes = (n: number) => n * 60_000;

describe('la huella del celular', () => {
  let server: SignInServer;
  let now = new Date('2026-10-27T08:00:00Z').getTime();
  let ip = 0;
  const phone = () => createDevice(server, { userAgent: androidPhone, ip: `181.0.0.${++ip}` });
  const newAuthenticator = () => createAuthenticator(testConfig.PUBLIC_ORIGIN);

  const link = async (
    device: ReturnType<typeof phone>,
    authenticator = newAuthenticator(),
    flags = {},
  ) => {
    const options = await device.request('/api/passkeys/options', {});
    if (options.status !== 200) return options;
    return device.request('/api/passkeys', { response: authenticator.create(options.body, flags) });
  };
  const signIn = async (
    device: ReturnType<typeof phone>,
    authenticator: ReturnType<typeof newAuthenticator>,
    flags = {},
  ) => {
    const options = await device.request('/api/sign-in/passkey/options', {});
    return device.request('/api/sign-in/passkey', {
      response: authenticator.get(options.body, flags),
      proofPublicKey: device.proofPublicKey,
    });
  };

  beforeAll(async () => {
    server = await createSignInServer({ now: () => new Date(now) });
  });
  afterAll(() => server.close());

  it('sign-in-E06 y E07: en un celular sin huella se ofrece, se vincula y después entra con ella', async () => {
    const device = phone();
    const google = await device.signInWithGoogle(admin);
    expect(google.body.offerPasskey).toBe(true);
    const authenticator = newAuthenticator();
    expect(await link(device, authenticator)).toMatchObject({ status: 200 });
    device.cookie = '';
    expect((await device.signInWithGoogle(admin)).body.offerPasskey).toBe(false);
    device.cookie = '';
    const entered = await signIn(device, authenticator);
    expect(entered).toMatchObject({
      status: 200,
      body: { person: { email: 'admin@example.com' }, offerPasskey: false },
    });
    expect(entered.cookie).toContain('__Host-session=');
  });

  it('sign-in-E10: en la computadora no se ofrece ni se puede vincular', async () => {
    const computer = createDevice(server, { ip: '181.1.0.1' });
    expect((await computer.signInWithGoogle(admin)).body.offerPasskey).toBe(false);
    expect((await link(computer)).status).toBe(400);
    expect((await computer.request('/api/passkeys', { response: {} })).status).toBe(400);
  });

  it('solo se vincula en los 5 minutos siguientes a entrar con Google, y con la sesión abierta', async () => {
    const device = phone();
    await device.signInWithGoogle(admin);
    now += minutes(5);
    expect(await link(device)).toMatchObject({ status: 403, body: { error: 'not-authorized' } });
    device.cookie = '';
    expect(await link(device)).toMatchObject({
      status: 401,
      body: { error: 'session-closed', reason: 'unknown' },
    });
    expect((await device.request('/api/passkeys', { response: {} })).status).toBe(401);
  });

  it('la huella tiene que ser de verdad: sin verificación no se vincula ni se entra', async () => {
    const device = phone();
    await device.signInWithGoogle(admin);
    expect((await link(device, newAuthenticator(), { userVerified: false })).status).toBe(400);
    const authenticator = newAuthenticator();
    await link(device, authenticator);
    device.cookie = '';
    expect((await signIn(device, authenticator, { userVerified: false })).status).toBe(401);
  });

  it('sign-in-E09: un celular vinculado a una cuenta no se vincula a otra', async () => {
    await server.platform.db
      .insertInto('users.users' as never)
      .values({ id: '00000000-0000-7000-8000-0000000000c1', email: 'otra@example.com' } as never)
      .execute();
    const device = phone();
    await device.signInWithGoogle(admin);
    await link(device);
    device.cookie = '';
    const other = await device.signInWithGoogle({ sub: 'sub-otra', email: 'otra@example.com' });
    expect(other.body.offerPasskey).toBe(false);
    expect(await link(device)).toMatchObject({
      status: 409,
      body: { error: 'phone-has-other-account' },
    });
  });

  it('volver a vincular en el mismo celular reemplaza la huella anterior', async () => {
    const device = phone();
    await device.signInWithGoogle(admin);
    const old = newAuthenticator();
    await link(device, old);
    const renewed = newAuthenticator();
    expect((await link(device, renewed)).status).toBe(200);
    device.cookie = '';
    expect((await signIn(device, old)).status).toBe(401);
    expect((await signIn(device, renewed)).status).toBe(200);
  });

  it('el contador en 0 de las huellas de Google se acepta; uno que retrocede, no', async () => {
    const device = phone();
    await device.signInWithGoogle(admin);
    const authenticator = newAuthenticator();
    await link(device, authenticator);
    expect((await signIn(device, authenticator)).status).toBe(200);
    expect((await signIn(device, authenticator, { counter: 5 })).status).toBe(200);
    expect((await signIn(device, authenticator, { counter: 3 })).status).toBe(401);
  });

  it('sign-in-E43: un desafío sirve una vez, y uno para vincular no sirve para entrar', async () => {
    const device = phone();
    await device.signInWithGoogle(admin);
    const authenticator = newAuthenticator();
    await link(device, authenticator);
    const options = await device.request('/api/sign-in/passkey/options', {});
    const response = authenticator.get(options.body);
    const body = { response, proofPublicKey: device.proofPublicKey };
    expect((await device.request('/api/sign-in/passkey', body)).status).toBe(200);
    expect((await device.request('/api/sign-in/passkey', body)).status).toBe(401);
    const linkOptions = await device.request('/api/passkeys/options', {});
    const wrong = {
      response: authenticator.get(linkOptions.body),
      proofPublicKey: device.proofPublicKey,
    };
    expect((await device.request('/api/sign-in/passkey', wrong)).status).toBe(401);
    const garbage = {
      response: { response: { clientDataJSON: 'x' } },
      proofPublicKey: device.proofPublicKey,
    };
    expect((await device.request('/api/sign-in/passkey', garbage)).status).toBe(401);
    device.cookie = '';
    await device.signInWithGoogle(admin);
    expect(
      (await device.request('/api/passkeys', { response: { response: { clientDataJSON: 'x' } } }))
        .status,
    ).toBe(400);
  });

  it('sign-in-E03: una cuenta dada de baja no entra con la huella', async () => {
    const id = '00000000-0000-7000-8000-0000000000d1';
    await server.platform.db
      .insertInto('users.users' as never)
      .values({ id, email: 'baja-huella@example.com' } as never)
      .execute();
    const device = phone();
    await device.signInWithGoogle({ sub: 'sub-baja', email: 'baja-huella@example.com' });
    const authenticator = newAuthenticator();
    await link(device, authenticator);
    await server.deactivate(id);
    device.cookie = '';
    expect(await signIn(device, authenticator)).toMatchObject({
      status: 401,
      body: { error: 'not-authorized' },
    });
  });

  it('rechaza un pedido mal formado o sin llave de prueba', async () => {
    const device = phone();
    expect((await device.request('/api/sign-in/passkey', { response: {} })).status).toBe(400);
    expect(
      (await device.request('/api/sign-in/passkey', { response: {}, proofPublicKey: 'AAAA' }))
        .status,
    ).toBe(400);
    await device.signInWithGoogle(admin);
    expect((await device.request('/api/passkeys', {})).status).toBe(400);
  });
});
