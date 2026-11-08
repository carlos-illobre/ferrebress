// Los tiempos de la sesión desde Administración (06 · R6; 01 · R3.2): valen en el momento para todas
// las sesiones, también las abiertas, en su próximo pedido.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRolesKit, minutes, type RolesKit } from '../../testing/users/roles-kit.ts';

describe('los tiempos de la sesión', () => {
  let kit: RolesKit;
  const version = { sessionIdle: 0, sessionMax: 0 };
  const set = async (key: 'sessionIdle' | 'sessionMax', value: number) => {
    const saved = await kit.admin.request(`/api/administration/settings/${key}`, {
      value,
      version: version[key],
    });
    version[key] = saved.body.version;
    return saved;
  };
  // Una persona con su sesión recién abierta, y lo que contesta su próximo pedido.
  const someone = async () => (await kit.person([await kit.systemRole()])).device;
  const isOpen = async (device: Awaited<ReturnType<typeof someone>>) =>
    (await device.request('/api/start')).body.person !== undefined;

  beforeAll(async () => {
    kit = await createRolesKit();
  });
  afterAll(() => kit.server.close());

  it('administration-E33: bajar el tiempo sin uso cierra en su próximo pedido la que ya lo pasó', async () => {
    const seller = await someone();
    kit.later(minutes(40));
    await kit.reconfirm();
    expect((await set('sessionIdle', 30)).status).toBe(200);
    expect(await isOpen(seller)).toBe(false);
    expect(kit.audited('session.ended').at(-1)).toMatchObject({ data: { reason: 'idle' } });
    expect((await set('sessionIdle', 120)).status).toBe(200);
  });

  it('administration-E34 y E35: bajar el tope cierra las pasadas, también la de quien cambió', async () => {
    const seller = await someone();
    await kit.reconfirm();
    // Las dos siguen en uso cada hora: el tiempo sin uso es de 120 minutos.
    for (let hours = 0; hours < 5; hours++) {
      kit.later(minutes(60));
      await seller.request('/api/start');
      await kit.admin.request('/api/start');
    }
    expect((await set('sessionMax', 4)).status).toBe(200);
    expect(await isOpen(seller)).toBe(false);
    expect((await kit.admin.request('/api/administration')).status).toBe(401);
  });

  it('administration-E36: subir el tope alarga la sesión abierta, con la cookie que ya tenía', async () => {
    // El tope está en 4 horas (la prueba de antes): la sesión se abre con ese tope.
    await kit.reconfirm();
    const seller = await someone();
    const hourOfUse = async () => {
      kit.later(minutes(60));
      await seller.request('/api/start');
      await kit.admin.request('/api/start');
    };
    for (let hours = 0; hours < 3; hours++) await hourOfUse();
    expect((await set('sessionMax', 12)).status).toBe(200);
    for (let hours = 3; hours < 10; hours++) await hourOfUse();
    expect(await isOpen(seller)).toBe(true);
    kit.later(minutes(2 * 60));
    expect(await isOpen(seller)).toBe(false);
  });
});
