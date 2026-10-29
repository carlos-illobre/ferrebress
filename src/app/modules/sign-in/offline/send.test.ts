import 'fake-indexeddb/auto';
import { act } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetProofKey } from '../../../platform/device/proof-key.ts';
import { lastReply, sessionClosed } from '../../../platform/server/api.ts';
import { fakeServer } from '../../../testing/fake-server.ts';
import { person, unknownToServer } from '../session.ts';
import { withOfflinePasskey } from './enter.ts';
import { eva, fakeFinger, ready, resetOffline, signInReply } from './offline-kit.ts';
import { enableOffline, offlineOption } from './option.ts';
import { entries } from './pending.ts';
import { sendPending, stopRetrying } from './send.ts';
import { watchOffline } from './watch.ts';

describe('el envío de lo pendiente', () => {
  beforeEach(resetOffline);
  afterEach(() => {
    stopRetrying();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('nunca manda dos a la vez, y si el servidor pide esperar, vuelve a probar solo', async () => {
    ready();
    fakeFinger();
    await act(() => withOfflinePasskey());
    const server = fakeServer({
      '/api/sign-in/offline': [
        { status: 429, body: { error: 'too-many-attempts', retryAfterSeconds: 2 } },
        { status: 500, body: { error: 'unexpected' } },
        signInReply,
      ],
    });
    // El reintento que deja programado, con su espera.
    const scheduled = vi.spyOn(globalThis, 'setTimeout');
    const retried = async (ms: number) => {
      const call = scheduled.mock.calls.findLast(([, delay]) => delay === ms);
      await act(async () => {
        const [run] = call as unknown as [() => void];
        run();
        await sendPending();
      });
    };
    await act(async () => {
      await Promise.all([sendPending(), sendPending()]);
    });
    expect(server.bodies('/api/sign-in/offline')).toHaveLength(1);
    await retried(2_000);
    expect(server.bodies('/api/sign-in/offline')).toHaveLength(2);
    await retried(60_000);
    expect(server.bodies('/api/sign-in/offline')).toHaveLength(3);
    expect(entries()).toEqual([]);
  });

  it('sin la llave de prueba no pide abrir la sesión, y la entrada aparece encima', async () => {
    ready();
    fakeFinger();
    await act(() => withOfflinePasskey());
    await forgetProofKey();
    const server = fakeServer({ '/api/sign-in/offline': { body: { ended: true } } });
    await act(() => sendPending());
    expect(server.bodies('/api/sign-in/offline')[0]).toMatchObject({ openSession: false });
    expect(sessionClosed.get()).toBe('offline-not-confirmed');
    expect(unknownToServer()).toBe(true);
  });
});

describe('lo que el celular aprende del servidor', () => {
  beforeEach(resetOffline);
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('cada respuesta con sesión de la persona de la opción es un contacto; sin sesión, cerrada o de otra, no', async () => {
    const stop = watchOffline();
    const tick = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    const contactAt = () => JSON.parse(localStorage.getItem('offline-contact') ?? '{}').at;
    const reply = async (at: number) => {
      act(() => lastReply.set(at));
      await tick();
    };
    await reply(1_000);
    expect(contactAt()).toBeUndefined();
    act(() => person.set(eva));
    await reply(2_000);
    expect(contactAt()).toBe(2_000);
    act(() => sessionClosed.set('idle'));
    await reply(3_000);
    expect(contactAt()).toBe(2_000);
    act(() => sessionClosed.set(undefined));
    enableOffline(eva);
    act(() => person.set({ ...eva, userId: 'otra' }));
    await reply(4_000);
    expect(contactAt()).toBe(2_000);
    // Un /api/start sin persona: cuando se mira, la persona ya no está.
    act(() => person.set(eva));
    act(() => {
      lastReply.set(5_000);
      person.set(undefined);
    });
    await tick();
    expect(contactAt()).toBe(2_000);
    stop();
  });

  it('offline-E05: la sesión cerrada desde otro dispositivo frena; la baja o perder la opción, la apagan', () => {
    ready();
    const stop = watchOffline();
    act(() => sessionClosed.set('revoked'));
    expect(offlineOption.get()?.revoked).toBe(true);
    act(() => sessionClosed.set('deactivated'));
    expect(offlineOption.get()).toBeUndefined();
    ready();
    act(() => sessionClosed.set(undefined));
    act(() => person.set({ ...eva, name: 'Otra', userId: 'otra' }));
    expect(offlineOption.get()).toBeDefined();
    const { offline: _, ...without } = eva;
    act(() => person.set(without));
    expect(offlineOption.get()).toBeUndefined();
    stop();
  });

  it('offline-E14: la sesión abierta sin conexión se corta a las 24 horas del último contacto', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-29T08:00:00'), toFake: ['Date', 'setInterval'] });
    ready();
    fakeFinger();
    await act(() => withOfflinePasskey());
    const stop = watchOffline();
    expect(sessionClosed.get()).toBeUndefined();
    act(() => {
      vi.advanceTimersByTime(24 * 3_600_000);
    });
    expect(sessionClosed.get()).toBe('offline-expired');
    stop();
  });
});
