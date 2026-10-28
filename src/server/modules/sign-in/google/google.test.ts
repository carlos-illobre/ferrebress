import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../../testing/sign-in-server.ts';

describe('entrar con Google', () => {
  let server: SignInServer;
  beforeAll(async () => {
    server = await createSignInServer();
  });
  afterAll(() => server.close());

  const rejected = () =>
    server.platform.audit
      .read(2026)
      .concat(server.platform.audit.read(new Date().getUTCFullYear()));

  it('sign-in-E01 y E05: el primer Administrador entra y queda con su sesión en una cookie que la página no lee', async () => {
    const device = createDevice(server);
    const response = await device.signInWithGoogle({
      sub: 'sub-admin',
      email: 'admin@example.com',
      name: 'Ana Gómez',
    });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      person: { name: 'Ana Gómez', email: 'admin@example.com', role: 'Administrador' },
      offerPasskey: false,
    });
    expect(response.cookie).toMatch(
      /^__Host-session=[\w-]{43}; Max-Age=28800; Path=\/; HttpOnly; Secure; SameSite=Strict$/,
    );
    const start = await device.request('/api/start');
    expect(start.body).toMatchObject({
      person: { email: 'admin@example.com' },
      environment: 'testing',
    });
    expect(start.body.googleNonce).toBeDefined();
  });

  it('sin nombre en el pase, la persona se llama como su correo; sin navegador conocido, «Otro navegador»', async () => {
    await sql`insert into users.users (id, email) values ('00000000-0000-7000-8000-0000000000aa', 'sin-nombre@example.com')`.execute(
      server.platform.db,
    );
    const device = createDevice(server, { userAgent: '', ip: '190.5.5.5' });
    const response = await device.signInWithGoogle({
      sub: 'sub-sin-nombre',
      email: 'sin-nombre@example.com',
      name: undefined,
    });
    expect(response.body.person.name).toBe('sin-nombre@example.com');
    const label = await sql<{
      device_label: string;
    }>`select device_label from sign_in.sessions where id = ${response.body.sessionId}`.execute(
      server.platform.db,
    );
    expect(label.rows[0]?.device_label).toBe('Otro navegador');
  });

  it('una persona que ya entró antes sin nombre guardado se llama como su correo', async () => {
    await sql`insert into users.users (id, email, google_subject) values ('00000000-0000-7000-8000-0000000000bb', 'viejo@example.com', 'sub-viejo')`.execute(
      server.platform.db,
    );
    const response = await createDevice(server, { ip: '190.7.7.7' }).signInWithGoogle({
      sub: 'sub-viejo',
      email: 'viejo@example.com',
    });
    expect(response.body.person.name).toBe('viejo@example.com');
  });

  it('una cookie inventada no es nadie', async () => {
    const device = createDevice(server, { ip: '190.6.6.6' });
    device.cookie = '__Host-session=inventada';
    expect((await device.request('/api/start')).body.person).toBeUndefined();
  });

  it('sign-in-E04: el correo se compara sin mayúsculas', async () => {
    const response = await createDevice(server).signInWithGoogle({
      sub: 'sub-admin',
      email: 'ADMIN@Example.com',
    });
    expect(response.status).toBe(200);
  });

  it('sign-in-E02: una cuenta no autorizada no entra, ve su correo y queda anotada', async () => {
    const response = await createDevice(server).signInWithGoogle({
      sub: 'sub-x',
      email: 'nadie@example.com',
    });
    expect(response).toMatchObject({
      status: 403,
      body: { error: 'not-authorized', email: 'nadie@example.com' },
    });
    expect(response.cookie).toBeNull();
    const event = rejected().find(
      (e) => e.type === 'sign-in.rejected' && e.email === 'nadie@example.com',
    );
    expect(event).toMatchObject({
      ipAddress: '190.1.2.3',
      data: { method: 'google', reason: 'unknown' },
    });
  });

  it('sign-in-E03: una cuenta dada de baja no entra', async () => {
    const device = createDevice(server);
    await device.signInWithGoogle({ sub: 'sub-admin', email: 'admin@example.com' });
    const admin = (await server.users.matchGoogle('sub-admin', 'admin@example.com', 'Ana')) as {
      user: { id: string };
    };
    await server.users.deactivate(admin.user.id);
    expect((await device.request('/api/start')).body.person).toBeUndefined();
    const again = await createDevice(server).signInWithGoogle({
      sub: 'sub-admin',
      email: 'admin@example.com',
    });
    expect(again.status).toBe(403);
  });

  it.each([
    ['vencido', { sub: 's', email: 'a@example.com' }, { expiresIn: '-1m' }],
    ['de otro cliente', { sub: 's', email: 'a@example.com' }, { audience: 'otro' }],
    [
      'con el correo sin verificar',
      { sub: 's', email: 'a@example.com', email_verified: false },
      {},
    ],
  ])('no acepta un pase %s', async (_, claims, options) => {
    const device = createDevice(server);
    const start = await device.request('/api/start');
    const credential = await server.google.credential(
      { nonce: start.body.googleNonce, ...claims },
      options,
    );
    const response = await device.request('/api/sign-in/google', {
      credential,
      proofPublicKey: device.proofPublicKey,
    });
    expect(response).toMatchObject({ status: 401, body: { error: 'not-authorized' } });
  });

  it('el nonce sirve una sola vez y tiene que ser uno que dio el servidor', async () => {
    const device = createDevice(server, { ip: '190.9.9.9' });
    const start = await device.request('/api/start');
    const credential = await server.google.credential({
      nonce: start.body.googleNonce,
      sub: 's',
      email: 'nadie@example.com',
    });
    const body = { credential, proofPublicKey: device.proofPublicKey };
    expect((await device.request('/api/sign-in/google', body)).status).toBe(403);
    expect(await device.request('/api/sign-in/google', body)).toMatchObject({
      status: 401,
      body: { error: 'sign-in-expired' },
    });
    const invented = await server.google.credential({
      nonce: 'inventado',
      sub: 's',
      email: 'nadie@example.com',
    });
    expect(
      (await device.request('/api/sign-in/google', { ...body, credential: invented })).body,
    ).toEqual({ error: 'sign-in-expired' });
  });

  it('rechaza un pedido sin dispositivo, mal formado o con una llave de prueba que no es P-256', async () => {
    const device = createDevice(server);
    expect((await device.request('/api/sign-in/google', { credential: 'x' })).status).toBe(400);
    expect(
      (await device.request('/api/sign-in/google', { credential: 'x', proofPublicKey: 'AAAA' }))
        .status,
    ).toBe(400);
    const response = await server.http.request('/api/sign-in/google', {
      method: 'POST',
      body: JSON.stringify({ credential: 'x', proofPublicKey: device.proofPublicKey }),
      headers: {
        Origin: 'https://ferrebress-pruebas.duckdns.org',
        'Content-Type': 'application/json',
      },
    });
    expect(response.status).toBe(400);
  });
});

describe('las llaves de Google', () => {
  it('sin llaves de prueba usa las de Google, y no las pide hasta que alguien entra', async () => {
    const { createServer } = await import('../../../app.ts');
    const { createSignInModule } = await import('../index.ts');
    const { createUsersModule } = await import('../../users/index.ts');
    const { testConfig } = await import('../../../testing/config.ts');
    const { module, users } = createUsersModule();
    const server = await createServer(testConfig, [module, createSignInModule({ users })]);
    expect((await server.http.request('/api/start')).status).toBe(200);
    await server.close();
  });
});
