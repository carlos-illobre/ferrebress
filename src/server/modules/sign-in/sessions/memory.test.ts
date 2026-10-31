// La memoria de sesiones y los cierres (diseño de 02, § 6; revisión de seguridad, 1): un pedido que
// leyó su sesión de la base mientras se cerraba no la vuelve a guardar abierta.
import { describe, expect, it, vi } from 'vitest';
import type { SessionRow, sessionsData } from './data.ts';
import { sessionStoreOf } from './store.ts';

const now = new Date('2026-10-31T12:00:00Z');
const clock = { now: () => now };

const row: SessionRow = {
  id: 's1',
  userId: 'u1',
  deviceId: 'd1',
  deviceLabel: 'Chrome en Android',
  ipAddress: '190.1.2.3',
  proofPublicKey: new Uint8Array(),
  createdAt: now,
  lastUsedAt: now,
  googleAt: null,
  way: 'google',
  isPhone: true,
  passkeyId: null,
  passkeyAt: null,
  approvedBy: null,
  closedReason: null,
};

describe('la memoria de sesiones', () => {
  it('lo leído de la base mientras alguien cerraba sesiones no queda en memoria', async () => {
    let answer: (found: SessionRow) => void = () => {};
    const findByTokenHash = vi.fn(
      () =>
        new Promise<SessionRow | undefined>((resolve) => {
          answer = resolve;
        }),
    );
    const data = {
      findByTokenHash,
      closeForUser: async () => ['s1'],
    } as unknown as ReturnType<typeof sessionsData>;
    const store = sessionStoreOf(data, clock, () => {});
    // El pedido lee su sesión de la base…
    const reading = store.resolve('pase');
    // …mientras otra persona la cierra (la baja) y confirma.
    const after = await store.closeForUser({} as never, 'u1', 'deactivated');
    after();
    // La lectura llega con la fila vieja, todavía abierta: ese pedido pasa, pero no la guarda.
    answer(row);
    expect((await reading).kind).toBe('open');
    // El próximo pedido vuelve a la base, que ya la tiene cerrada.
    const next = store.resolve('pase');
    answer({ ...row, closedReason: 'deactivated' });
    expect(await next).toEqual({ kind: 'closed', reason: 'deactivated' });
    expect(findByTokenHash).toHaveBeenCalledTimes(2);
  });

  it('sin cierres en el medio, lo leído queda en memoria y el próximo pedido no consulta', async () => {
    const findByTokenHash = vi.fn(async () => row);
    const data = { findByTokenHash } as unknown as ReturnType<typeof sessionsData>;
    const store = sessionStoreOf(data, clock, () => {});
    await store.resolve('otro');
    await store.resolve('otro');
    expect(findByTokenHash).toHaveBeenCalledTimes(1);
  });
});
