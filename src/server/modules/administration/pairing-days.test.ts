// Los días del vínculo desde Administración (06 · R7; 03 · R2.2): valen en el momento para todos los
// vínculos, y uno que ya pasó el plazo nuevo se termina en su próximo contacto, como vencido.
import { randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createRolesKit, minutes, type RolesKit } from '../../testing/users/roles-kit.ts';

const days = (n: number) => minutes(n * 24 * 60);

describe('los días del vínculo', () => {
  let kit: RolesKit;
  let version = 0;
  const setDays = async (value: number) => {
    await kit.reconfirm();
    const saved = await kit.admin.request('/api/administration/settings/pairingDays', {
      value,
      version,
    });
    version = saved.body.version;
    return saved;
  };
  // Un vínculo de la computadora de esa persona que espejó por última vez hace `ago`.
  const pairedAgo = async (ago: number, who = { id: '', device: kit.admin }) => {
    const at = new Date(kit.server.platform.clock.now().getTime() - ago);
    await sql`insert into device_link.pairings values (${randomUUID()}, ${who.id || kit.adminId},
      ${randomUUID()}, ${who.device.id}, 'Chrome en Android', 'Chrome en Windows', 'button', ${at},
      ${at}, null)`.execute(kit.server.platform.db);
    return { at };
  };
  const check = async (device = kit.admin) => (await device.request('/api/device-link/check')).body;

  beforeAll(async () => {
    kit = await createRolesKit();
  });
  afterAll(() => kit.server.close());

  it('administration-E40: subirlos alarga el vínculo desde la última vez que espejaron', async () => {
    const { at } = await pairedAgo(days(20));
    expect((await check()).pairing).toMatchObject({ lastsDays: 30 });
    expect((await setDays(60)).status).toBe(200);
    expect((await check()).pairing).toMatchObject({
      lastsDays: 60,
      expiresAt: at.getTime() + days(60),
    });
  });

  it('si la memoria tenía una fecha vieja y en la base espejó hace poco, sigue', async () => {
    const recent = kit.server.platform.clock.now();
    await sql`update device_link.pairings set mirrored_at = ${recent}`.execute(
      kit.server.platform.db,
    );
    expect((await setDays(15)).status).toBe(200);
    expect((await check()).pairing).toMatchObject({ lastsDays: 15 });
    expect((await check()).pairing).toMatchObject({ lastMirrored: recent.getTime() });
  });

  it('administration-E39: bajarlos termina en su próximo contacto el que ya pasó el plazo', async () => {
    const other = await kit.person([await kit.systemRole()]);
    await pairedAgo(days(12), other);
    expect((await check(other.device)).pairing).toMatchObject({ lastsDays: 15 });
    expect((await setDays(10)).status).toBe(200);
    expect(await check(other.device)).toEqual({});
    expect(kit.audited('device-link.ended').at(-1)).toMatchObject({ data: { reason: 'expired' } });
  });
});
