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

describe('la auditoría de entrar con el celular', () => {
  let server: SignInServer;
  let now = new Date('2026-10-27T08:00:00Z').getTime();
  const time = manualWait();
  const ip = '190.4.4.4';

  beforeAll(async () => {
    server = await createSignInServer({ now: () => new Date(now) }, { wait: time.wait });
  });
  afterAll(() => server.close());

  const rejections = (deviceId: string) =>
    server.platform.audit
      .read(2026)
      .filter((event) => event.type === 'sign-in.rejected' && event.deviceId === deviceId)
      .map((event) => event.data);

  it('sign-in-E44: un código vencido, una reserva vencida y la firma de otro desafío quedan anotados, con el dispositivo', async () => {
    const phone = createDevice(server, { userAgent: androidPhone, ip });
    await phone.signInWithGoogle(admin);
    const authenticator = createAuthenticator(testConfig.PUBLIC_ORIGIN);
    const options = await phone.request('/api/passkeys/options', {});
    await phone.request('/api/passkeys', { response: authenticator.create(options.body) });

    const first = await openScreen(server, createDevice(server, { ip }));
    const second = await openScreen(server, createDevice(server, { ip }));
    const readFirst = await phone.request('/api/sign-in/codes/read', { code: first.lastCode() });
    const readSecond = await phone.request('/api/sign-in/codes/read', { code: second.lastCode() });
    // La huella firma el desafío de la segunda computadora, pero aprueba la primera.
    const otherChallenge = await phone.request('/api/sign-in/codes/approve', {
      secret: readFirst.body.secret,
      kind: 'assertion',
      response: authenticator.get(readSecond.body.authentication),
    });
    expect(otherChallenge.status).toBe(401);
    now += 120_000;
    const late = await phone.request('/api/sign-in/codes/approve', {
      secret: readSecond.body.secret,
      kind: 'assertion',
      response: authenticator.get(readSecond.body.authentication),
    });
    expect(late.status).toBe(410);
    const third = await openScreen(server, createDevice(server, { ip }));
    const code = third.lastCode();
    now += 61_000;
    expect((await phone.request('/api/sign-in/codes/read', { code })).status).toBe(410);

    expect(rejections(phone.id)).toEqual([
      { method: 'qr', reason: 'other-challenge' },
      { method: 'qr', reason: 'code-expired' },
      { method: 'qr', reason: 'code-expired' },
    ]);
    for (const screen of [first, second, third]) await screen.close();
  });
});
