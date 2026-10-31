// Cuántas consultas a la base hace cada pedido de entrar (diseño de 01, § 12): que no aparezca una
// consulta de más, ni una dentro de un bucle.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testConfig } from '../../testing/config.ts';
import { createAuthenticator } from '../../testing/sign-in/authenticator.ts';
import { openScreen } from '../../testing/sign-in/screen-channel.ts';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../testing/sign-in/sign-in-server.ts';

const androidPhone =
  'Mozilla/5.0 (Linux; Android 14; moto e13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36';
const admin = { sub: 'sub-admin', email: 'admin@example.com' };

describe('las consultas de cada pedido', () => {
  let server: SignInServer;
  let network = 0;
  const device = (userAgent?: string) =>
    createDevice(server, { ip: `190.7.0.${++network}`, ...(userAgent && { userAgent }) });

  beforeAll(async () => {
    server = await createSignInServer();
  });
  afterAll(() => server.close());

  it('con la sesión ya en memoria, /api/start no consulta la base', async () => {
    const pc = device();
    await pc.signInWithGoogle(admin);
    await pc.request('/api/start');
    expect(await server.countQueries(() => pc.request('/api/start'))).toBe(0);
  });

  it('un nonce nuevo para la entrada abierta: sin consultas y solo el nonce (01 · R2.1)', async () => {
    const phone = device(androidPhone);
    let reply: Awaited<ReturnType<typeof phone.request>> | undefined;
    expect(
      await server.countQueries(async () => {
        reply = await phone.request('/api/sign-in/google/nonce');
      }),
    ).toBe(0);
    expect(Object.keys(reply?.body)).toEqual(['nonce']);
    // Lo que se paga con datos del celular: el cuerpo entero, menos de 50 bytes.
    expect(JSON.stringify(reply?.body).length).toBeLessThan(50);
    // Y sirve para entrar con Google.
    const credential = await server.google.credential({ ...admin, nonce: reply?.body.nonce });
    const signedIn = await phone.request('/api/sign-in/google', {
      credential,
      proofPublicKey: phone.proofPublicKey,
    });
    expect(signedIn.status).toBe(200);
  });

  it('entrar con Google: hasta 3 en la computadora, hasta 4 en el celular', async () => {
    const pc = device();
    const start = await pc.request('/api/start');
    const credential = await server.google.credential({ ...admin, nonce: start.body.googleNonce });
    const google = (from: typeof pc, pass: string) =>
      from.request('/api/sign-in/google', {
        credential: pass,
        proofPublicKey: from.proofPublicKey,
      });
    expect(await server.countQueries(() => google(pc, credential))).toBeLessThanOrEqual(3);
    const phone = device(androidPhone);
    const phoneStart = await phone.request('/api/start');
    const phonePass = await server.google.credential({
      ...admin,
      nonce: phoneStart.body.googleNonce,
    });
    expect(await server.countQueries(() => google(phone, phonePass))).toBeLessThanOrEqual(4);
  });

  // Entrar anota la última entrada, solo si la persona sigue activa (02, § 5): una consulta más.
  it('entrar con la huella: 5; leer un código: hasta 3; aprobarlo: hasta 5', async () => {
    const ip = '190.7.9.1';
    const phone = createDevice(server, { ip, userAgent: androidPhone });
    await phone.signInWithGoogle(admin);
    const authenticator = createAuthenticator(testConfig.PUBLIC_ORIGIN);
    const linkOptions = await phone.request('/api/passkeys/options', {});
    await phone.request('/api/passkeys', { response: authenticator.create(linkOptions.body) });
    phone.cookie = '';
    const options = await phone.request('/api/sign-in/passkey/options', {});
    const signIn = () =>
      phone.request('/api/sign-in/passkey', {
        response: authenticator.get(options.body),
        proofPublicKey: phone.proofPublicKey,
      });
    let entered = 0;
    expect(
      await server.countQueries(async () => {
        entered = (await signIn()).status;
      }),
    ).toBe(5);
    expect(entered).toBe(200);
    // Entró con la huella: la persona no estaba en memoria, la busca una vez y después ya no.
    expect((await phone.request('/api/start')).body.person).toMatchObject({ email: admin.email });
    expect(await server.countQueries(() => phone.request('/api/start'))).toBe(0);
    const screen = await openScreen(server, createDevice(server, { ip }));
    let read = { status: 0, body: { secret: '', authentication: { challenge: '' } } };
    const reading = async () => {
      read = await phone.request('/api/sign-in/codes/read', { code: screen.lastCode() });
    };
    expect(await server.countQueries(reading)).toBeLessThanOrEqual(3);
    expect(read.status).toBe(200);
    let approved = 0;
    const approve = async () => {
      const answer = await phone.request('/api/sign-in/codes/approve', {
        secret: read.body.secret,
        kind: 'assertion',
        response: authenticator.get(read.body.authentication),
      });
      approved = answer.status;
    };
    expect(await server.countQueries(approve)).toBeLessThanOrEqual(5);
    expect(approved).toBe(200);
    await screen.close();
  });
});
