// El dispositivo, atado a su llave (diseño de 01, § 6; revisión de seguridad del código de 04b,
// punto 1): copiar su identificador no alcanza para entrar como él.
import { deviceProofHeaderName } from '@ferrebress/shared/contracts/sign-in';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../../testing/sign-in/sign-in-server.ts';

const admin = { sub: 'sub-admin', email: 'admin@example.com' };

describe('la llave del dispositivo', () => {
  let server: SignInServer;
  beforeAll(async () => {
    server = await createSignInServer();
  });
  afterAll(() => server.close());
  const rejected = () =>
    server.platform.audit
      .read(new Date().getUTCFullYear())
      .filter((e) => e.type === 'sign-in.rejected' && e.data?.reason === 'device-unproven');

  it('seguridad: la primera entrada ata la llave; con el identificador copiado y otra llave, no entra', async () => {
    const counter = createDevice(server);
    expect((await counter.signInWithGoogle(admin)).status).toBe(200);
    // Otra vez, el mismo dispositivo con su llave.
    counter.cookie = '';
    expect((await counter.signInWithGoogle(admin)).status).toBe(200);
    // Alguien copió el identificador con F12: su navegador tiene otra llave.
    const home = createDevice(server, { ip: '200.5.5.5' });
    Object.assign(home, { id: counter.id });
    const copied = await home.signInWithGoogle(admin);
    expect(copied).toMatchObject({ status: 401, body: { error: 'device-unproven' } });
    expect(rejected()).toHaveLength(1);
  });

  it('seguridad: sin la prueba, con un nonce ya usado o con la firma de otra entrada, no entra', async () => {
    const device = createDevice(server);
    const start = await device.request('/api/start');
    const pass = async () =>
      server.google.credential({
        nonce: (await device.request('/api/start')).body.googleNonce,
        ...admin,
      });
    const body = async () => ({ credential: await pass(), proofPublicKey: device.proofPublicKey });
    expect(start.status).toBe(200);
    const without = await device.request('/api/sign-in/google', await body(), {
      [deviceProofHeaderName]: '',
    });
    expect(without.body.error).toBe('device-unproven');
    // Sin la cabecera, tampoco.
    const { proveDevice } = device;
    Object.assign(device, { proveDevice: undefined });
    const missing = await device.request('/api/sign-in/google', await body());
    Object.assign(device, { proveDevice });
    expect(missing.body.error).toBe('device-unproven');
    const proof = await device.proveDevice(device.proofPublicKey);
    const first = await device.request('/api/sign-in/google', await body(), {
      [deviceProofHeaderName]: proof,
    });
    expect(first.status).toBe(200);
    device.cookie = '';
    const again = await device.request('/api/sign-in/google', await body(), {
      [deviceProofHeaderName]: proof,
    });
    expect(again.body.error).toBe('device-unproven');
    // Una firma hecha para otra llave de prueba no sirve para esta.
    const other = createDevice(server);
    const forOther = await device.proveDevice(other.proofPublicKey);
    const mismatched = await device.request('/api/sign-in/google', await body(), {
      [deviceProofHeaderName]: forOther,
    });
    expect(mismatched.body.error).toBe('device-unproven');
  });
});
