import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createOfflineKit, hours } from '../../../testing/sign-in/offline-kit.ts';

describe('entrar sin conexión: seguridad y bordes de la confirmación', () => {
  let kit: Awaited<ReturnType<typeof createOfflineKit>>;
  beforeAll(async () => {
    kit = await createOfflineKit();
  });
  afterAll(() => kit.server.close());

  it('seguridad: un /api/start sin sesión no mueve el último contacto', async () => {
    const linked = await kit.linkedPhone();
    linked.phone.cookie = '';
    kit.clock.now += hours(20);
    await linked.phone.request('/api/start');
    kit.clock.now += hours(5);
    await linked.phone.request('/api/start');
    const entry = await kit.offlineEntry(linked);
    expect(await kit.send(linked, entry)).toMatchObject({ status: 401 });
    expect(await kit.rowOf(entry.id)).toEqual({ result: 'rejected', reason: 'too-late' });
  });

  it('offline-E10: si la última sesión la cerró otro dispositivo, no se confirma', async () => {
    const linked = await kit.linkedPhone();
    await kit.server.runJobs();
    await sql`update sign_in.sessions set closed_reason = 'revoked', closed_at = now()
      where device_id = ${linked.phone.id}`.execute(kit.server.platform.db);
    const entry = await kit.offlineEntry(linked);
    await kit.send(linked, entry);
    expect(await kit.rowOf(entry.id)).toEqual({ result: 'rejected', reason: 'revoked-session' });
  });

  it('seguridad: una firma de más de 29 días o de más de un día en el futuro, con el reloj del servidor, no se confirma', async () => {
    const linked = await kit.linkedPhone();
    const old = await kit.offlineEntry(
      linked,
      {},
      { signedAt: new Date(kit.clock.now - hours(24 * 30)).toISOString() },
    );
    expect((await kit.send(linked, old)).status).toBe(401);
    expect((await kit.rowOf(old.id))?.reason).toBe('too-old');
    const ahead = await kit.offlineEntry(
      linked,
      {},
      { signedAt: new Date(kit.clock.now + hours(25)).toISOString() },
    );
    expect((await kit.send(linked, ahead)).status).toBe(401);
    expect((await kit.rowOf(ahead.id))?.reason).toBe('too-old');
  });

  it('seguridad: la misma entrada, a los 31 días, ya borrada su fila, no se vuelve a confirmar', async () => {
    const linked = await kit.linkedPhone();
    const entry = await kit.offlineEntry(linked);
    expect((await kit.send(linked, entry)).status).toBe(200);
    kit.clock.now += hours(24 * 31);
    await kit.server.runJobs();
    expect(await kit.rowOf(entry.id)).toBeUndefined();
    // El celular se sigue usando: tiene una sesión nueva.
    linked.phone.cookie = '';
    await linked.phone.signInWithGoogle(linked.claims);
    linked.phone.cookie = '';
    expect((await kit.send(linked, entry)).status).toBe(401);
    expect((await kit.rowOf(entry.id))?.reason).toBe('too-old');
  });

  it('lo que no tiene la forma se rechaza antes de mirar nada', async () => {
    const linked = await kit.linkedPhone();
    expect((await kit.send(linked, { id: 'x' })).status).toBe(400);
    const badProof = await kit.offlineEntry(linked, { proofPublicKey: 'abc' });
    expect((await kit.send(linked, badProof)).status).toBe(400);
  });

  it('las firmas que no verifican frenan la huella de esa cuenta por una hora, como con conexión', async () => {
    const linked = await kit.linkedPhone();
    const statuses: number[] = [];
    for (let tries = 0; tries < 21; tries++) {
      // De a 10 por minuto, para no llegar al límite por dispositivo.
      if (tries % 10 === 0) kit.clock.now += 61_000;
      const bad = await kit.offlineEntry(linked, {
        signedAt: new Date(kit.clock.now - tries - 1).toISOString(),
      });
      statuses.push((await kit.send(linked, bad)).status);
    }
    expect(statuses.slice(0, 20)).toEqual(Array(20).fill(401));
    expect(statuses[20]).toBe(429);
  });

  it('dos confirmaciones de la misma entrada a la vez: una sola abre sesión', async () => {
    const linked = await kit.linkedPhone();
    const entry = await kit.offlineEntry(linked);
    const both = await Promise.all([kit.send(linked, entry), kit.send(linked, entry)]);
    expect(both.map((reply) => reply.status).sort()).toEqual([200, 409]);
    const ended = await kit.offlineEntry(linked, { openSession: false });
    const twice = await Promise.all([kit.send(linked, ended), kit.send(linked, ended)]);
    expect(twice.map((reply) => reply.status).sort()).toEqual([200, 409]);
  });

  it('sin ninguna sesión guardada de ese celular, no se confirma', async () => {
    const linked = await kit.linkedPhone();
    await kit.server.runJobs();
    await sql`delete from sign_in.sessions where device_id = ${linked.phone.id}`.execute(
      kit.server.platform.db,
    );
    const entry = await kit.offlineEntry(linked);
    await kit.send(linked, entry);
    expect(await kit.rowOf(entry.id)).toEqual({ result: 'rejected', reason: 'too-late' });
  });

  it('las entradas de más de 30 días se borran', async () => {
    const linked = await kit.linkedPhone();
    const entry = await kit.offlineEntry(linked);
    await kit.send(linked, entry);
    kit.clock.now += hours(24 * 31);
    await kit.server.runJobs();
    expect(await kit.rowOf(entry.id)).toBeUndefined();
  });
});
