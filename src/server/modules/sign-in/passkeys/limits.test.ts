import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createAuthenticator } from '../../../testing/authenticator.ts';
import { testConfig } from '../../../testing/config.ts';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../../testing/sign-in-server.ts';

const androidPhone =
  'Mozilla/5.0 (Linux; Android 14; moto e13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36';
const admin = { sub: 'sub-admin', email: 'admin@example.com' };

describe('los límites de intentos con la huella', () => {
  let server: SignInServer;
  let ip = 0;
  const phone = () => createDevice(server, { userAgent: androidPhone, ip: `182.0.0.${++ip}` });
  beforeAll(async () => {
    server = await createSignInServer();
  });
  afterAll(() => server.close());

  it('sign-in-E20: más de 20 pedidos por minuto desde un dispositivo se frenan', async () => {
    const device = phone();
    const statuses = [];
    for (let i = 0; i < 21; i++)
      statuses.push((await device.request('/api/sign-in/passkey/options', {})).status);
    expect(statuses.slice(0, 10).every((status) => status === 200)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });

  it('sign-in-E20c: 20 firmas falsas para una cuenta frenan su huella, pero no Google', async () => {
    const owner = phone();
    await owner.signInWithGoogle(admin);
    const authenticator = createAuthenticator(testConfig.PUBLIC_ORIGIN);
    const options = await owner.request('/api/passkeys/options', {});
    await owner.request('/api/passkeys', { response: authenticator.create(options.body) });

    const forge = async () => {
      const attacker = phone();
      const challenge = await attacker.request('/api/sign-in/passkey/options', {});
      const response = authenticator.get(challenge.body);
      // Una firma bien formada, pero de otra llave.
      response.response.signature = createAuthenticator(testConfig.PUBLIC_ORIGIN).get(
        challenge.body,
      ).response.signature;
      return attacker.request('/api/sign-in/passkey', {
        response,
        proofPublicKey: attacker.proofPublicKey,
      });
    };
    for (let i = 0; i < 20; i++) expect((await forge()).status).toBe(401);
    expect(await forge()).toMatchObject({ status: 429, body: { error: 'too-many-attempts' } });

    owner.cookie = '';
    const challenge = await owner.request('/api/sign-in/passkey/options', {});
    const real = await owner.request('/api/sign-in/passkey', {
      response: authenticator.get(challenge.body),
      proofPublicKey: owner.proofPublicKey,
    });
    expect(real.status).toBe(429);
    expect((await phone().signInWithGoogle(admin)).status).toBe(200);
  });

  it('cada dirección tiene un tope de desafíos vivos', async () => {
    const owner = phone();
    await owner.signInWithGoogle(admin);
    const statuses = [];
    for (let i = 0; i < 11; i++)
      statuses.push((await owner.request('/api/passkeys/options', {})).status);
    expect(statuses.at(-1)).toBe(429);
    const other = phone();
    for (let i = 0; i < 10; i++) await other.request('/api/sign-in/passkey/options', {});
    expect((await other.request('/api/sign-in/passkey/options', {})).status).toBe(429);
  });
});
