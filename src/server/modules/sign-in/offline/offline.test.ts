import { randomUUID } from 'node:crypto';
import { offlineChallenge } from '@ferrebress/shared/contracts/offline-sign-in';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { testConfig } from '../../../testing/config.ts';
import { createAuthenticator } from '../../../testing/sign-in/authenticator.ts';
import { androidPhone, createOfflineKit, hours } from '../../../testing/sign-in/offline-kit.ts';
import { createDevice } from '../../../testing/sign-in/sign-in-server.ts';

describe('entrar sin conexión: la confirmación del servidor', () => {
  let kit: Awaited<ReturnType<typeof createOfflineKit>>;
  beforeAll(async () => {
    kit = await createOfflineKit();
  });
  afterAll(() => kit.server.close());

  it('offline-E15: confirmada, abre la sesión y la persona sigue', async () => {
    const linked = await kit.linkedPhone();
    expect(linked.linked.body).toEqual({ ok: true, offline: true });
    linked.phone.cookie = '';
    const entry = await kit.offlineEntry(linked);
    const confirmed = await kit.send(linked, entry);
    expect(confirmed).toMatchObject({
      status: 200,
      body: { person: { userId: linked.userId, offline: true }, offerPasskey: false },
    });
    expect(confirmed.cookie).toContain('__Host-session=');
    expect(await kit.rowOf(entry.id)).toEqual({ result: 'confirmed', reason: null });
    const audited = kit.server.platform.audit
      .read(2026)
      .find((event) => event.type === 'sign-in.offline-confirmed' && event.data?.id === entry.id);
    expect(audited?.data).toMatchObject({ signedAt: entry.signedAt });
  });

  it('offline-E18: la misma entrada otra vez no abre otra sesión', async () => {
    const linked = await kit.linkedPhone();
    const entry = await kit.offlineEntry(linked);
    expect((await kit.send(linked, entry)).status).toBe(200);
    linked.phone.cookie = '';
    expect(await kit.send(linked, entry)).toMatchObject({
      status: 409,
      body: { error: 'offline-already-confirmed' },
      cookie: null,
    });
  });

  it('offline-E19: un dato cambiado después de firmar, o la firma de otra huella, no se confirman', async () => {
    const linked = await kit.linkedPhone();
    const changed = await kit.offlineEntry(linked, {
      signedAt: new Date(kit.clock.now + 1).toISOString(),
    });
    expect(await kit.send(linked, changed)).toMatchObject({
      status: 401,
      body: { error: 'offline-not-confirmed' },
    });
    expect(await kit.rowOf(changed.id)).toBeUndefined();
    const other = createAuthenticator(testConfig.PUBLIC_ORIGIN);
    const forged = await kit.offlineEntry({ ...linked, authenticator: other });
    expect((await kit.send(linked, forged)).status).toBe(401);
    const unverified = await kit.offlineEntry(linked);
    const challenge = await offlineChallenge({
      ...unverified,
      deviceId: linked.phone.id,
      credentialId: linked.authenticator.credentialId,
    });
    unverified.response = linked.authenticator.get({ challenge }, { userVerified: false });
    expect((await kit.send(linked, unverified)).status).toBe(401);
  });

  it('offline-E20: con la huella de una cuenta, otra cuenta o desde otro celular no se confirma', async () => {
    const linked = await kit.linkedPhone();
    const otherAccount = await kit.offlineEntry({ ...linked, userId: randomUUID() });
    expect((await kit.send(linked, otherAccount)).status).toBe(401);
    const otherPhone = createDevice(kit.server, { userAgent: androidPhone, ip: '181.3.0.1' });
    const elsewhere = await kit.offlineEntry({ ...linked, phone: otherPhone });
    expect((await otherPhone.request('/api/sign-in/offline', elsewhere)).status).toBe(401);
  });

  it('offline-E16: si la cuenta se dio de baja mientras tanto, no se confirma y queda anotado', async () => {
    const linked = await kit.linkedPhone();
    await kit.server.users.deactivate(linked.userId);
    linked.phone.cookie = '';
    const entry = await kit.offlineEntry(linked);
    expect(await kit.send(linked, entry)).toMatchObject({
      status: 401,
      body: { error: 'not-authorized' },
    });
    expect(await kit.rowOf(entry.id)).toEqual({ result: 'rejected', reason: 'deactivated' });
    // Repetirla dice lo mismo.
    expect((await kit.send(linked, entry)).body.error).toBe('offline-not-confirmed');
  });

  it('offline-R3.1: llegada más de 24 horas después del último contacto con sesión, no se confirma', async () => {
    const linked = await kit.linkedPhone();
    kit.clock.now += hours(24) + 6 * 60_000;
    const entry = await kit.offlineEntry(linked);
    expect((await kit.send(linked, entry)).body.error).toBe('offline-not-confirmed');
    expect(await kit.rowOf(entry.id)).toEqual({ result: 'rejected', reason: 'too-late' });
  });

  it('offline-E21: si la persona ya salió, se confirma sin abrir sesión', async () => {
    const linked = await kit.linkedPhone();
    linked.phone.cookie = '';
    const entry = await kit.offlineEntry(linked, { openSession: false });
    expect(await kit.send(linked, entry)).toMatchObject({
      status: 200,
      body: { ended: true },
      cookie: null,
    });
    expect(await kit.rowOf(entry.id)).toEqual({ result: 'ended', reason: null });
    expect((await kit.send(linked, entry)).status).toBe(409);
  });

  it('offline-E01 a E04: la persona trae `offline` solo con su huella en este celular', async () => {
    const linked = await kit.linkedPhone();
    expect((await linked.phone.request('/api/start')).body.person.offline).toBe(true);
    const computer = createDevice(kit.server, { ip: '181.4.0.1' });
    await computer.signInWithGoogle(linked.claims);
    expect((await computer.request('/api/start')).body.person.offline).toBeUndefined();
    // Otra persona en el mismo celular no ve la opción con la huella ajena.
    const other = await kit.newAccount();

    linked.phone.cookie = '';
    const google = await linked.phone.signInWithGoogle(other);
    expect(google.body.person.offline).toBeUndefined();
    expect((await linked.phone.request('/api/start')).body.person.offline).toBeUndefined();
    linked.phone.cookie = '';
    expect((await linked.phone.request('/api/start')).body.person).toBeUndefined();
  });
});
