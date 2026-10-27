import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createAuthenticator } from '../../../testing/authenticator.ts';
import { testConfig } from '../../../testing/config.ts';
import { manualWait, openScreen } from '../../../testing/screen-channel.ts';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../../testing/sign-in-server.ts';

const androidPhone =
  'Mozilla/5.0 (Linux; Android 14; moto e13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36';
const admin = { sub: 'sub-admin', email: 'admin@example.com' };
const cities: Record<string, string> = {
  '190.1.2.3': 'Córdoba',
  '181.0.0.1': 'Córdoba',
  '181.0.0.2': 'Buenos Aires',
};

describe('entrar a la computadora con el celular', () => {
  let server: SignInServer;
  let now = new Date('2026-10-27T08:00:00Z').getTime();
  const time = manualWait();
  const computer = () => createDevice(server, { ip: '190.1.2.3' });
  const phone = (ip = '181.0.0.1') => createDevice(server, { userAgent: androidPhone, ip });

  // Un celular con su huella vinculada y, si se pide, sin la sesión abierta.
  async function phoneWithPasskey(ip?: string, signedIn = true) {
    const device = phone(ip);
    await device.signInWithGoogle(admin);
    const authenticator = createAuthenticator(testConfig.PUBLIC_ORIGIN);
    const options = await device.request('/api/passkeys/options', {});
    await device.request('/api/passkeys', { response: authenticator.create(options.body) });
    if (!signedIn) device.cookie = '';
    return { device, authenticator };
  }

  beforeAll(async () => {
    const findCity = async (ip: string) => cities[ip];
    server = await createSignInServer({ now: () => new Date(now) }, { findCity, wait: time.wait });
  });
  afterAll(() => server.close());

  it('sign-in-E12 y E13: la computadora recibe un código; el celular lo lee, ve la computadora y aprueba con la huella', async () => {
    const pc = computer();
    const screen = await openScreen(server, pc);
    expect(screen.events).toEqual([{ type: 'code', code: expect.stringMatching(/^[\w-]{22}$/) }]);
    const { device, authenticator } = await phoneWithPasskey();
    const read = await device.request('/api/sign-in/codes/read', { code: screen.lastCode() });
    expect(read).toMatchObject({
      status: 200,
      body: {
        computer: { label: 'Chrome en Windows' },
        place: { kind: 'same-city', city: 'Córdoba' },
        holdSeconds: 120,
      },
    });
    expect(read.body.registration).toBeUndefined();
    await screen.settle();
    expect(screen.events.at(-1)).toEqual({ type: 'read' });
    const response = authenticator.get(read.body.authentication);
    const approved = await device.request('/api/sign-in/codes/approve', {
      secret: read.body.secret,
      kind: 'assertion',
      response,
    });
    expect(approved.status).toBe(200);
    await screen.settle();
    const permit = screen.events.at(-1)?.permit as string;
    const claimed = await screen.claim(permit);
    expect(claimed.status).toBe(200);
    expect(await claimed.json()).toMatchObject({ person: { email: 'admin@example.com' } });
    expect(claimed.headers.get('Set-Cookie')).toContain('__Host-session=');
    expect((await screen.claim(permit)).status).toBe(400);
    await screen.close();
  });

  it('sign-in-E13b y E13c: avisa si las ciudades no coinciden, o dice que están en la misma red', async () => {
    const screen = await openScreen(server, computer());
    const { device } = await phoneWithPasskey('181.0.0.2');
    const far = await device.request('/api/sign-in/codes/read', { code: screen.lastCode() });
    expect(far.body.place).toEqual({
      kind: 'different-cities',
      computerCity: 'Córdoba',
      phoneCity: 'Buenos Aires',
    });
    await screen.close();
    const other = await openScreen(server, computer());
    const near = await (await phoneWithPasskey('190.1.2.3')).device.request(
      '/api/sign-in/codes/read',
      { code: other.lastCode() },
    );
    expect(near.body.place).toEqual({ kind: 'same-network' });
    await other.close();
  });

  it('sign-in-E14 y E15: un código leído no sirve para otro celular, y uno de hace un minuto tampoco', async () => {
    const screen = await openScreen(server, computer());
    const code = screen.lastCode();
    await (await phoneWithPasskey()).device.request('/api/sign-in/codes/read', { code });
    const second = await (await phoneWithPasskey()).device.request('/api/sign-in/codes/read', {
      code,
    });
    expect(second).toMatchObject({ status: 410, body: { error: 'code-used' } });
    await screen.close();
    const fresh = await openScreen(server, computer());
    now += 60_000;
    const late = await phone().request('/api/sign-in/codes/read', { code: fresh.lastCode() });
    expect(late).toMatchObject({ status: 410, body: { error: 'code-expired' } });
    await fresh.close();
  });

  it('cada minuto llega un código nuevo y el anterior deja de servir', async () => {
    const screen = await openScreen(server, computer());
    const first = screen.lastCode();
    time.elapse();
    await screen.settle();
    expect(screen.lastCode()).not.toBe(first);
    expect((await phone().request('/api/sign-in/codes/read', { code: first })).body.error).toBe(
      'code-expired',
    );
    await screen.close();
  });

  it('sign-in-E16: un celular sin sesión, con la huella vinculada, entra él y hace entrar a la computadora con una huella', async () => {
    const screen = await openScreen(server, computer());
    const { device, authenticator } = await phoneWithPasskey(undefined, false);
    const read = await device.request('/api/sign-in/codes/read', { code: screen.lastCode() });
    expect(read.body.holdSeconds).toBe(300);
    const response = authenticator.get(read.body.authentication);
    const body = {
      secret: read.body.secret,
      kind: 'assertion',
      response,
      proofPublicKey: device.proofPublicKey,
    };
    const approved = await device.request('/api/sign-in/codes/approve', body);
    expect(approved.status).toBe(200);
    expect(approved.cookie).toContain('__Host-session=');
    await screen.settle();
    expect(screen.events.at(-1)?.type).toBe('approved');
    await screen.close();
  });

  it('sign-in-E16b: un celular que entró con Google y no tiene huella la vincula ahí y con esa aprueba', async () => {
    const screen = await openScreen(server, computer());
    const device = phone();
    device.cookie = '';
    await device.signInWithGoogle(admin);
    const read = await device.request('/api/sign-in/codes/read', { code: screen.lastCode() });
    expect(read.body.registration).toBeDefined();
    const authenticator = createAuthenticator(testConfig.PUBLIC_ORIGIN);
    const response = authenticator.create(read.body.registration);
    const approved = await device.request('/api/sign-in/codes/approve', {
      secret: read.body.secret,
      kind: 'registration',
      response,
    });
    expect(approved.status).toBe(200);
    await screen.settle();
    expect(screen.events.at(-1)?.type).toBe('approved');
    await screen.close();
  });

  it('sign-in-E16c: «No soy yo» devuelve la computadora a un código nuevo, y solo lo puede tocar quien leyó', async () => {
    const screen = await openScreen(server, computer());
    const first = screen.lastCode();
    const { device } = await phoneWithPasskey();
    const read = await device.request('/api/sign-in/codes/read', { code: first });
    const stranger = phone();
    expect(
      (await stranger.request('/api/sign-in/codes/cancel', { secret: 'otro-secreto' })).status,
    ).toBe(410);
    expect(
      (await device.request('/api/sign-in/codes/cancel', { secret: read.body.secret })).status,
    ).toBe(200);
    await screen.settle();
    expect(screen.events.slice(-2).map((event) => event.type)).toEqual(['cancelled', 'code']);
    expect(screen.lastCode()).not.toBe(first);
    await screen.close();
  });
});
