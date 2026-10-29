import { offlineOpenMessage } from '@ferrebress/shared/contracts/offline-sign-in';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { androidPhone, createOfflineKit, hours } from '../../../testing/sign-in/offline-kit.ts';
import { createDevice } from '../../../testing/sign-in/sign-in-server.ts';

// Los ataques de la revisión de seguridad del código (offline-security-review.md, 8 a 13).
describe('entrar sin conexión: lo que intenta un atacante', () => {
  let kit: Awaited<ReturnType<typeof createOfflineKit>>;
  beforeAll(async () => {
    kit = await createOfflineKit();
  });
  afterAll(() => kit.server.close());

  // Otro dispositivo que manda el identificador del celular de la víctima, con su propia llave.
  const thief = (deviceId: string) => {
    const device = createDevice(kit.server, { userAgent: androidPhone, ip: '200.1.1.1' });
    device.id = deviceId as typeof device.id;
    return device;
  };

  it('seguridad, 8: quien copia la entrada guardada no puede abrir la sesión con ella', async () => {
    const linked = await kit.linkedPhone();
    linked.phone.cookie = '';
    const entry = await kit.offlineEntry(linked);
    const stranger = thief(linked.phone.id);
    // Sin la llave de prueba del celular, no puede firmar que abre la sesión.
    const copied = { ...entry, openSignature: stranger.prove(offlineOpenMessage(entry.id)) };
    expect(await stranger.request('/api/sign-in/offline', copied)).toMatchObject({
      status: 401,
      cookie: null,
    });
    // Con su propia llave en lugar de la del celular, la firma de la huella deja de servir.
    const swapped = { ...copied, proofPublicKey: stranger.proofPublicKey };
    expect((await stranger.request('/api/sign-in/offline', swapped)).status).toBe(401);
    expect(
      (await stranger.request('/api/sign-in/offline', { ...entry, openSignature: undefined }))
        .status,
    ).toBe(401);
    expect(await kit.rowOf(entry.id)).toBeUndefined();
    // El celular, que sí tiene su llave, la confirma igual.
    expect((await kit.send(linked, entry)).status).toBe(200);
  });

  it('seguridad, 10: la sesión de otra cuenta con el identificador del celular no alarga el plazo', async () => {
    const linked = await kit.linkedPhone();
    kit.clock.now += hours(30);
    const other = thief(linked.phone.id);
    await other.signInWithGoogle(await kit.newAccount());
    const entry = await kit.offlineEntry(linked);
    linked.phone.cookie = '';
    expect((await kit.send(linked, entry)).status).toBe(401);
    expect(await kit.rowOf(entry.id)).toEqual({ result: 'rejected', reason: 'too-late' });
  });

  it('seguridad, 11: repetir una entrada se anota a nombre de quien la mandó primero, una vez por ventana', async () => {
    const linked = await kit.linkedPhone();
    const entry = await kit.offlineEntry(linked);
    await kit.send(linked, entry);
    const before = kit.server.platform.audit.read(2026).length;
    const stranger = thief(linked.phone.id);
    for (let tries = 0; tries < 5; tries++) {
      await stranger.request('/api/sign-in/offline', { ...entry, userId: crypto.randomUUID() });
    }
    const repeated = kit.server.platform.audit
      .read(2026)
      .slice(before)
      .filter((event) => event.type === 'sign-in.offline-repeated');
    expect(repeated).toHaveLength(1);
    expect(repeated[0]?.userId).toBe(linked.userId);
  });
});
