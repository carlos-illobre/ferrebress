import { createHash } from 'node:crypto';
import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createDevice,
  createSignInServer,
  type SignInServer,
} from '../../../testing/sign-in/sign-in-server.ts';

const minutes = (n: number) => n * 60_000;

describe('la sesión', () => {
  let server: SignInServer;
  let now = new Date('2026-10-27T08:00:00Z').getTime();
  const clock = { now: () => new Date(now) };
  const admin = { sub: 'sub-admin', email: 'admin@example.com' };
  const personOf = async (device: ReturnType<typeof createDevice>) =>
    (await device.request('/api/start')).body.person;
  const endedCount = () =>
    server.platform.audit.read(2026).filter((event) => event.type === 'session.ended').length;

  beforeAll(async () => {
    server = await createSignInServer(clock);
  });
  afterAll(() => server.close());

  it('sign-in-E21 y E22: sigue con uso cada 59 minutos y vence a los 60 sin uso', async () => {
    const device = createDevice(server);
    await device.signInWithGoogle(admin);
    now += minutes(59);
    expect(await personOf(device)).toBeDefined();
    now += minutes(59);
    expect(await personOf(device)).toBeDefined();
    now += minutes(60);
    expect(await personOf(device)).toBeUndefined();
  });

  it('sign-in-E23 y E24: vence a las 8 horas aunque se use sin parar', async () => {
    const device = createDevice(server);
    await device.signInWithGoogle(admin);
    for (let i = 0; i < 15; i++) {
      now += minutes(30);
      expect(await personOf(device)).toBeDefined();
    }
    now += minutes(30);
    expect(await personOf(device)).toBeUndefined();
  });

  it('sign-in-E35: Salir cierra la sesión y borra la cookie', async () => {
    const device = createDevice(server);
    await device.signInWithGoogle(admin);
    const cookie = device.cookie;
    const response = await device.request('/api/sign-out', {});
    expect(response.cookie).toContain('Max-Age=0');
    device.cookie = cookie;
    expect(await personOf(device)).toBeUndefined();
  });

  it('sign-in-E36: una salida pendiente se cierra con la firma de su llave de prueba, aunque la cookie sea de otro', async () => {
    const device = createDevice(server);
    const first = await device.signInWithGoogle(admin);
    const firstCookie = device.cookie;
    const sessionId = first.body.sessionId as string;
    const stranger = createDevice(server);
    const forged = await stranger.request('/api/sign-out', {
      pending: { sessionId, signature: stranger.prove(`sign-out:${sessionId}`) },
    });
    expect(forged.status).toBe(200);
    device.cookie = firstCookie;
    expect(await personOf(device)).toBeDefined();
    // Otra sesión en el mismo dispositivo: la cookie ya no es la de la salida pendiente.
    device.cookie = '';
    const second = await device.signInWithGoogle(admin);
    expect(second.body.sessionId).not.toBe(sessionId);
    const tappedAt = Date.parse('2026-10-27T07:58:00Z');
    await device.request('/api/sign-out', {
      pending: { sessionId, signature: device.prove(`sign-out:${sessionId}`), tappedAt },
    });
    device.cookie = firstCookie;
    expect(await personOf(device)).toBeUndefined();
    // Se anota cuándo tocó «Salir» el dispositivo; cuándo llegó es la hora del registro.
    const signOut = server.platform.audit
      .read(2026)
      .filter((event) => event.type === 'sign-out')
      .at(-1);
    expect(signOut?.data).toEqual({ pending: true, tappedAt: '2026-10-27T07:58:00.000Z' });
  });

  it('una salida pendiente de una sesión que no existe o ya está cerrada no hace nada', async () => {
    const device = createDevice(server);
    const { body } = await device.signInWithGoogle(admin);
    await device.request('/api/sign-out', {});
    const missing = '00000000-0000-7000-8000-00000000ffff';
    for (const sessionId of [missing, body.sessionId]) {
      const response = await device.request('/api/sign-out', {
        pending: { sessionId, signature: device.prove(`sign-out:${sessionId}`) },
      });
      expect(response.status).toBe(200);
    }
    expect(
      (await device.request('/api/sign-out', { pending: { sessionId: 'x', signature: 'y' } }))
        .status,
    ).toBe(400);
  });

  it('las salidas pendientes sin sesión tienen el límite de los pedidos sin sesión', async () => {
    const device = createDevice(server, { ip: '190.7.7.7' });
    const pending = { sessionId: '00000000-0000-7000-8000-00000000fff1', signature: 'firma' };
    for (let i = 0; i < 30; i++)
      expect((await device.request('/api/sign-out', { pending })).status).toBe(200);
    expect((await device.request('/api/sign-out', { pending })).status).toBe(429);
    // Salir sin pendiente no se frena.
    expect((await device.request('/api/sign-out', {})).status).toBe(200);
  });

  it('sign-in-E27: una sesión cerrada desde otro lado se nota en el próximo pedido', async () => {
    const device = createDevice(server);
    await device.signInWithGoogle(admin);
    const other = createDevice(server);
    const { body } = await other.signInWithGoogle(admin);
    const deactivated = await server.users.matchGoogle(admin.sub, admin.email, 'Ana');
    expect(deactivated.kind).toBe('found');
    await server.deactivate(body.person.userId);
    expect(await personOf(device)).toBeUndefined();
    expect(await personOf(other)).toBeUndefined();
    const reasons = await sql<{
      closed_reason: string;
    }>`select distinct closed_reason from sign_in.sessions`.execute(server.platform.db);
    expect(reasons.rows.map((row) => row.closed_reason)).toContain('deactivated');
    const ended = server.platform.audit
      .read(2026)
      .filter((event) => event.type === 'session.ended');
    expect(ended.map((event) => (event.data as { reason: string }).reason)).toEqual(
      expect.arrayContaining(['idle', 'max-age', 'deactivated']),
    );
    await sql`update users.users set active = true`.execute(server.platform.db);
  });

  it('sign-in-E40: en la base solo está el hash del pase, nunca el pase', async () => {
    const device = createDevice(server);
    await device.signInWithGoogle(admin);
    const token = device.cookie.split('=')[1] as string;
    const rows = await sql<{
      token_hash: Uint8Array;
    }>`select token_hash from sign_in.sessions`.execute(server.platform.db);
    const hashes = rows.rows.map((row) => Buffer.from(row.token_hash).toString('hex'));
    expect(hashes).toContain(createHash('sha256').update(token).digest('hex'));
    const dump = JSON.stringify(
      (await sql`select * from sign_in.sessions`.execute(server.platform.db)).rows,
    );
    expect(dump).not.toContain(token);
  });

  it('los últimos usos se escriben juntos, y la limpieza cierra las vencidas y borra las viejas', async () => {
    await sql`delete from sign_in.sessions`.execute(server.platform.db);
    const device = createDevice(server);
    await device.signInWithGoogle(admin);
    const signedInAt = now;
    now += minutes(10);
    await personOf(device);
    await server.runJobs();
    const rows = async () =>
      (
        await sql<{
          last_used_at: Date;
          closed_reason: string | null;
        }>`select last_used_at, closed_reason from sign_in.sessions`.execute(server.platform.db)
      ).rows;
    expect((await rows())[0]?.last_used_at.getTime()).toBe(signedInAt + minutes(10));
    now += minutes(61);
    const endedBefore = endedCount();
    await server.runJobs();
    expect((await rows())[0]?.closed_reason).toBe('idle');
    // La limpieza la anota, una vez, aunque nadie la haya vuelto a usar (revisión de código, 5.3).
    expect(endedCount()).toBe(endedBefore + 1);
    await personOf(device);
    expect(endedCount()).toBe(endedBefore + 1);
    now += minutes(30 * 24 * 60 + 1);
    await server.runJobs();
    expect(await rows()).toEqual([]);
  });

  it('users-R1 (02, § 5): si la dan de baja mientras entra, la sesión recién abierta se cierra y no entra', async () => {
    const { recordSignIn } = server.users;
    // La baja llega entre que se crea la sesión y se anota la entrada.
    server.users.recordSignIn = async () => false;
    const device = createDevice(server);
    const entered = await device.signInWithGoogle(admin);
    server.users.recordSignIn = recordSignIn;
    expect(entered).toMatchObject({ status: 403, body: { error: 'not-authorized' } });
    expect(entered.cookie).toBeNull();
    const open = await sql<{ n: number }>`select count(*)::int as n from sign_in.sessions
      where device_id = ${device.id} and closed_at is null`.execute(server.platform.db);
    expect(open.rows[0]?.n).toBe(0);
  });
});
