import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../../testing/sign-in-server.ts';

describe('los límites de intentos con Google', () => {
  let server: SignInServer;
  beforeAll(async () => {
    server = await createSignInServer();
  });
  afterAll(() => server.close());

  it('sign-in-E20: el pedido 11 en un minuto desde un dispositivo se frena y dice cuánto falta', async () => {
    const device = createDevice(server, { ip: '200.0.0.1' });
    for (let i = 0; i < 10; i++)
      await device.request('/api/sign-in/google', {
        credential: 'x',
        proofPublicKey: device.proofPublicKey,
      });
    const response = await device.request('/api/sign-in/google', {
      credential: 'x',
      proofPublicKey: device.proofPublicKey,
    });
    expect(response).toMatchObject({ status: 429, body: { error: 'too-many-attempts' } });
    expect(response.body.retryAfterSeconds).toBeGreaterThan(0);
    const throttled = server.platform.audit
      .read(new Date().getUTCFullYear())
      .filter((e) => e.type === 'sign-in.throttled');
    await device.request('/api/sign-in/google', {
      credential: 'x',
      proofPublicKey: device.proofPublicKey,
    });
    const again = server.platform.audit
      .read(new Date().getUTCFullYear())
      .filter((e) => e.type === 'sign-in.throttled');
    expect(throttled).toHaveLength(1);
    expect(again).toHaveLength(1);
  });

  it('sign-in-E20b: 20 fallos en una hora con una cuenta, desde dispositivos distintos, frenan esa cuenta', async () => {
    for (let i = 0; i < 20; i++) {
      const response = await createDevice(server, { ip: `201.0.0.${i}` }).signInWithGoogle({
        sub: 's',
        email: 'intruso@example.com',
      });
      expect(response.status).toBe(403);
    }
    const blocked = await createDevice(server, { ip: '201.0.1.1' }).signInWithGoogle({
      sub: 's',
      email: 'intruso@example.com',
    });
    expect(blocked).toMatchObject({ status: 429, body: { error: 'too-many-attempts' } });
  });

  it('/api/start también tiene su límite por dirección', async () => {
    const device = createDevice(server, { ip: '202.0.0.1' });
    const statuses = [];
    for (let i = 0; i < 31; i++) statuses.push((await device.request('/api/start')).status);
    expect(statuses.slice(0, 10).every((status) => status === 200)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
  });
});
