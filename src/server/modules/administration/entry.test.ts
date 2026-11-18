// La entrada desde Administración (06 · R11; 01 · R2.9, R2.10; 15 · R2.2): los intentos valen desde
// el próximo, la dirección tiene su tope fijo, y las horas sin conexión llegan a los celulares en cada
// respuesta.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDevice } from '../../testing/sign-in/sign-in-server.ts';
import { createRolesKit, type RolesKit } from '../../testing/users/roles-kit.ts';

const android =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36';

describe('la entrada', () => {
  let kit: RolesKit;
  const versions: Record<string, number> = {};
  const set = async (key: string, value: number) => {
    await kit.reconfirm();
    const saved = await kit.admin.request(`/api/administration/settings/${key}`, {
      value,
      version: versions[key] ?? 0,
    });
    versions[key] = saved.body.version;
    return saved;
  };
  const tryGoogle = (device: ReturnType<typeof createDevice>) =>
    device.request('/api/sign-in/google', {
      credential: 'x',
      proofPublicKey: device.proofPublicKey,
    });

  beforeAll(async () => {
    kit = await createRolesKit();
  });
  afterAll(() => kit.server.close());

  it('administration-E58: con 3 por minuto, el cuarto intento desde el mismo dispositivo se frena', async () => {
    expect((await set('googleAttempts', 3)).status).toBe(200);
    const device = createDevice(kit.server, { ip: '210.0.0.1' });
    const statuses = [];
    for (let i = 0; i < 4; i++) statuses.push((await tryGoogle(device)).status);
    expect(statuses.slice(0, 3)).toEqual([401, 401, 401]);
    const blocked = await tryGoogle(device);
    expect(blocked).toMatchObject({ status: 429, body: { error: 'too-many-attempts' } });
    expect(blocked.body.retryAfterSeconds).toBeGreaterThan(0);
    // Otro dispositivo de la misma dirección sigue pudiendo: el número es por dispositivo.
    expect((await tryGoogle(createDevice(kit.server, { ip: '210.0.0.1' }))).status).toBe(401);
    await set('googleAttempts', 10);
  });

  it('01-R2.9: por dirección, un tope fijo de 60 por minuto, aunque sean dispositivos distintos', async () => {
    const statuses = [];
    for (let i = 0; i < 61; i++)
      statuses.push((await tryGoogle(createDevice(kit.server, { ip: '211.0.0.1' }))).status);
    expect(statuses.slice(0, 60).every((status) => status === 401)).toBe(true);
    expect(statuses.at(-1)).toBe(429);
    const throttled = kit.server.platform.audit
      .read(2026)
      .filter((e) => e.type === 'request.throttled' && e.data?.by === 'ip');
    expect(throttled.length).toBeGreaterThan(0);
  });

  it('administration-R11.3: los fallidos por hora de una cuenta, con el número de ahora', async () => {
    expect((await set('failedAttempts', 5)).status).toBe(200);
    const intruder = (i: number) =>
      createDevice(kit.server, { ip: `212.0.0.${i}` }).signInWithGoogle({
        sub: 's-intruso',
        email: 'intruso@example.com',
      });
    for (let i = 0; i < 5; i++) expect((await intruder(i)).status).toBe(403);
    expect(await intruder(9)).toMatchObject({ status: 429 });
    await set('failedAttempts', 20);
  });

  it('administration-E57 y E59: las horas sin conexión, a los celulares en cada respuesta; fuera de rango, no', async () => {
    const phone = createDevice(kit.server, { userAgent: android, ip: '213.0.0.1' });
    await phone.signInWithGoogle({ sub: 'sub-admin', email: 'admin@example.com' });
    expect((await phone.request('/api/administration')).header).toContain('h=24');
    expect((await set('offlineHours', 4)).status).toBe(200);
    expect((await phone.request('/api/administration')).header).toContain('h=4');
    // La computadora no las necesita.
    expect((await kit.admin.request('/api/administration')).header).not.toContain('h=');
    for (const [key, value] of [
      ['googleAttempts', 2],
      ['passkeyAttempts', 61],
      ['failedAttempts', 4],
      ['failedAttempts', 101],
      ['offlineHours', 36],
    ] as const)
      expect((await set(key, value)).status).toBe(400);
  });
});
