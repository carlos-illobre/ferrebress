import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createAuthenticator } from '../../../testing/authenticator.ts';
import { appHeaders, testConfig } from '../../../testing/config.ts';
import { manualWait, openScreen } from '../../../testing/screen-channel.ts';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../../testing/sign-in-server.ts';

const androidPhone =
  'Mozilla/5.0 (Linux; Android 14; moto e13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36';
const admin = { sub: 'sub-admin', email: 'admin@example.com' };

describe('entrar con el celular: lo que no tiene que pasar', () => {
  let server: SignInServer;
  let now = new Date('2026-10-27T08:00:00Z').getTime();
  let network = 0;
  let ip = '';
  const time = manualWait();
  // Cada computadora en una red nueva; el celular, en la red de la última computadora.
  const computer = () => {
    ip = `190.9.0.${++network}`;
    return createDevice(server, { ip });
  };
  const phone = () => createDevice(server, { userAgent: androidPhone, ip });
  async function linkedPhone(signedIn = true) {
    const device = phone();
    await device.signInWithGoogle(admin);
    const authenticator = createAuthenticator(testConfig.PUBLIC_ORIGIN);
    const options = await device.request('/api/passkeys/options', {});
    await device.request('/api/passkeys', { response: authenticator.create(options.body) });
    if (!signedIn) device.cookie = '';
    return { device, authenticator };
  }

  beforeAll(async () => {
    server = await createSignInServer({ now: () => new Date(now) }, { wait: time.wait });
  });
  afterAll(() => server.close());

  it('al aprobar se vuelve a mirar la red: desde otra, no', async () => {
    const screen = await openScreen(server, computer());
    const { device, authenticator } = await linkedPhone();
    const read = await device.request('/api/sign-in/codes/read', { code: screen.lastCode() });
    const elsewhere = createDevice(server, { userAgent: androidPhone, ip: '181.9.9.9' });
    const response = authenticator.get(read.body.authentication);
    const approved = await elsewhere.request('/api/sign-in/codes/approve', {
      secret: read.body.secret,
      kind: 'assertion',
      response,
    });
    expect(approved).toMatchObject({ status: 409, body: { error: 'other-network' } });
    await screen.close();
  });

  it('si la reserva vence sin huella, la computadora vuelve a un código nuevo', async () => {
    const screen = await openScreen(server, computer());
    const { device } = await linkedPhone();
    await device.request('/api/sign-in/codes/read', { code: screen.lastCode() });
    time.elapse();
    await screen.settle();
    expect(screen.events.at(-1)?.type).toBe('read');
    now += 120_000;
    time.elapse();
    await screen.settle();
    expect(screen.events.slice(-3).map((event) => event.type)).toEqual([
      'read',
      'cancelled',
      'code',
    ]);
    await screen.close();
  });

  it('aprobar exige la huella firmada para esta reserva, de alguien activo', async () => {
    const screen = await openScreen(server, computer());
    const { device, authenticator } = await linkedPhone();
    const read = await device.request('/api/sign-in/codes/read', { code: screen.lastCode() });
    const approve = (body: object) =>
      device.request('/api/sign-in/codes/approve', { secret: read.body.secret, ...body });
    const otherChallenge = authenticator.get({
      challenge: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    });
    expect((await approve({ kind: 'assertion', response: otherChallenge })).status).toBe(401);
    const stranger = createAuthenticator(testConfig.PUBLIC_ORIGIN).get(read.body.authentication);
    expect((await approve({ kind: 'assertion', response: stranger })).status).toBe(401);
    await sql`update users.users set active = false`.execute(server.platform.db);
    expect(
      (await approve({ kind: 'assertion', response: authenticator.get(read.body.authentication) }))
        .status,
    ).toBe(401);
    await sql`update users.users set active = true`.execute(server.platform.db);
    expect(
      (
        await device.request('/api/sign-in/codes/approve', {
          secret: 'nada',
          kind: 'assertion',
          response: {},
        })
      ).status,
    ).toBe(410);
    expect((await device.request('/api/sign-in/codes/approve', { secret: 'nada' })).status).toBe(
      400,
    );
    // Aprobar es un intento con la huella: 20 por minuto (R2.9; revisión de seguridad, 29).
    for (let i = 0; i < 20; i++)
      await device.request('/api/sign-in/codes/approve', { secret: 'nada' });
    expect((await device.request('/api/sign-in/codes/approve', { secret: 'nada' })).status).toBe(
      429,
    );
    now += 60_000;
    await screen.close();
  });

  it('un celular sin sesión tiene que mandar su llave de prueba, y uno sin huella no aprueba sin vincularla', async () => {
    const screen = await openScreen(server, computer());
    const { device, authenticator } = await linkedPhone(false);
    const read = await device.request('/api/sign-in/codes/read', { code: screen.lastCode() });
    const response = authenticator.get(read.body.authentication);
    expect(
      (
        await device.request('/api/sign-in/codes/approve', {
          secret: read.body.secret,
          kind: 'assertion',
          response,
        })
      ).status,
    ).toBe(400);
    const registration = createAuthenticator(testConfig.PUBLIC_ORIGIN).create({
      challenge: read.body.authentication.challenge,
      user: { id: 'x' },
    });
    const anonymous = await device.request('/api/sign-in/codes/approve', {
      secret: read.body.secret,
      kind: 'registration',
      response: registration,
    });
    expect(anonymous).toMatchObject({ status: 401, body: { error: 'session-closed' } });
    await screen.close();
  });

  it('el permiso solo lo usa la computadora que abrió la pantalla', async () => {
    const other = await openScreen(server, computer());
    const screen = await openScreen(server, computer());
    const { device, authenticator } = await linkedPhone();
    const read = await device.request('/api/sign-in/codes/read', { code: screen.lastCode() });
    await device.request('/api/sign-in/codes/approve', {
      secret: read.body.secret,
      kind: 'assertion',
      response: authenticator.get(read.body.authentication),
    });
    await screen.settle();
    const permit = screen.events.at(-1)?.permit as string;
    expect((await other.claim(permit)).status).toBe(401);
    expect((await screen.claim(permit)).status).toBe(401);
    await screen.close();
    await other.close();
  });

  it('topes: tres pantallas por dirección; sin cookie no hay canal; pedidos mal formados', async () => {
    const pc = computer();
    const screens = [
      await openScreen(server, pc),
      await openScreen(server, pc),
      await openScreen(server, pc),
    ];
    expect((await pc.request('/api/sign-in/codes', {})).status).toBe(429);
    for (let i = 0; i < 7; i++) await pc.request('/api/sign-in/codes', {});
    expect(await pc.request('/api/sign-in/codes', {})).toMatchObject({
      status: 429,
      body: { error: 'too-many-attempts' },
    });
    for (const screen of screens) await screen.close();
    const headers = appHeaders();
    expect((await server.http.request('/api/realtime/sign-in-codes', { headers })).status).toBe(
      404,
    );
    const device = phone();
    expect((await device.request('/api/sign-in/codes/read', { code: '' })).status).toBe(400);
    expect((await device.request('/api/sign-in/codes/cancel', {})).status).toBe(410);
    for (let i = 0; i < 10; i++) await device.request('/api/sign-in/codes/read', { code: 'x' });
    expect((await device.request('/api/sign-in/codes/read', { code: 'x' })).status).toBe(429);
  });
});

describe('vincular la huella al aprobar', () => {
  let server: SignInServer;
  let now = new Date('2026-10-27T08:00:00Z').getTime();
  const time = manualWait();
  beforeAll(async () => {
    server = await createSignInServer({ now: () => new Date(now) }, { wait: time.wait });
  });
  afterAll(() => server.close());

  it('exige Google reciente, una huella de verdad y que el celular no tenga otra cuenta', async () => {
    const device = createDevice(server, { userAgent: androidPhone, ip: '190.7.0.1' });
    await device.signInWithGoogle(admin);
    const register = async (flags = {}) => {
      const screen = await openScreen(server, createDevice(server, { ip: '190.7.0.1' }));
      const read = await device.request('/api/sign-in/codes/read', { code: screen.lastCode() });
      const response = createAuthenticator(testConfig.PUBLIC_ORIGIN).create(
        { challenge: read.body.authentication.challenge, user: { id: 'x' } },
        flags,
      );
      const result = await device.request('/api/sign-in/codes/approve', {
        secret: read.body.secret,
        kind: 'registration',
        response,
      });
      await screen.close();
      return result.status;
    };
    expect(await register({ userVerified: false })).toBe(401);
    await sql`insert into users.users (id, email) values ('00000000-0000-7000-8000-0000000000e1', 'otra@example.com')`.execute(
      server.platform.db,
    );
    const other = createDevice(server, { userAgent: androidPhone, ip: '181.7.0.2' });
    Object.assign(other, { id: device.id });
    await other.signInWithGoogle({ sub: 'sub-otra', email: 'otra@example.com' });
    const options = await other.request('/api/passkeys/options', {});
    await other.request('/api/passkeys', {
      response: createAuthenticator(testConfig.PUBLIC_ORIGIN).create(options.body),
    });
    expect(await register()).toBe(409);
    now += 5 * 60_000;
    expect(await register()).toBe(403);
  });
});

describe('con la espera de verdad', () => {
  it('la pantalla recibe su código y se cierra sin esperar el minuto', async () => {
    const server = await createSignInServer();
    const screen = await openScreen(server, createDevice(server, { ip: '190.8.0.1' }));
    expect(screen.events).toEqual([{ type: 'code', code: expect.any(String) }]);
    await screen.close();
    await server.close();
  });
});
