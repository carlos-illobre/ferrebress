import 'fake-indexeddb/auto';
import { act } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lastReply, sessionClosed } from '../../../platform/server/api.ts';
import { fakeServer } from '../../../testing/fake-server.ts';
import { offlineSession, person, signOut } from '../session.ts';
import { isOwn, withOfflinePasskey } from './enter.ts';
import { assertion, eva, fakeFinger, resetOffline } from './offline-kit.ts';
import { entries, pendingEntries } from './pending.ts';
import { contacted, enableOffline, permit } from './permit.ts';
import { sendPending } from './send.ts';
import { watchOffline } from './watch.ts';

const signInReply = { body: { person: eva, sessionId: 's1', offerPasskey: false } };

// Un celular con la opción prendida y el último contacto recién.
function ready() {
  contacted(Date.now());
  enableOffline(eva);
}

describe('entrar sin conexión con la huella', () => {
  beforeEach(resetOffline);
  afterEach(() => vi.unstubAllGlobals());

  it('offline-R2.5: la huella tiene que ser de la persona del permiso y verificada', () => {
    expect(isOwn(assertion(), eva.userId)).toBe(true);
    expect(isOwn(assertion(eva.userId, false), eva.userId)).toBe(false);
    expect(isOwn(assertion('0190a000-0000-7000-8000-0000000000bb'), eva.userId)).toBe(false);
    expect(isOwn({ response: { userHandle: '%%%' } }, eva.userId)).toBe(false);
    expect(isOwn({ response: { userHandle: 'AA' } }, eva.userId)).toBe(false);
    const short = { response: { ...assertion().response, authenticatorData: 'AA' } };
    expect(isOwn(short, eva.userId)).toBe(false);
  });

  it('offline-E07: entra directo con la persona guardada y deja la entrada para confirmar', async () => {
    ready();
    const get = fakeFinger();
    await act(() => withOfflinePasskey());
    expect(get).toHaveBeenCalledOnce();
    expect(person.get()).toEqual(eva);
    const [entry] = entries();
    expect(entry).toMatchObject({ userId: eva.userId, ended: false });
    expect(offlineSession()).toBe(entry?.id);
    expect(pendingEntries.get()).toBe(1);
  });

  it('offline-E12, E13: sin la opción, cancelada o con otra huella, no entra', async () => {
    const get = fakeFinger(null);
    await withOfflinePasskey();
    expect(get).not.toHaveBeenCalled();
    ready();
    await withOfflinePasskey();
    expect(get).toHaveBeenCalledOnce();
    fakeFinger(assertion('0190a000-0000-7000-8000-0000000000bb'));
    await withOfflinePasskey();
    expect(person.get()).toBeUndefined();
    expect(entries()).toEqual([]);
  });

  it('offline-E15: al volver la red se confirma, y la sesión sigue como una normal', async () => {
    ready();
    fakeFinger();
    await act(() => withOfflinePasskey());
    const server = fakeServer({ '/api/sign-in/offline': signInReply });
    await act(() => sendPending());
    expect(server.bodies('/api/sign-in/offline')[0]).toMatchObject({
      userId: eva.userId,
      openSession: true,
    });
    expect(server.bodies('/api/sign-in/offline')[0]).not.toHaveProperty('ended');
    expect(entries()).toEqual([]);
    expect(offlineSession()).toBeUndefined();
    expect(sessionClosed.get()).toBeUndefined();
  });

  it('offline-R3: sin red, con demasiados intentos o con una versión nueva, sigue pendiente', async () => {
    ready();
    fakeFinger();
    await act(() => withOfflinePasskey());
    for (const reply of [
      'offline' as const,
      { status: 429, body: { error: 'too-many-attempts' } },
      { status: 426, body: { error: 'update-required' } },
    ]) {
      fakeServer({ '/api/sign-in/offline': reply });
      await act(() => sendPending());
      expect(entries()).toHaveLength(1);
    }
  });

  it('offline-E17: si el servidor no la confirma, aparece la entrada encima', async () => {
    ready();
    fakeFinger();
    await act(() => withOfflinePasskey());
    fakeServer({
      '/api/sign-in/offline': { status: 401, body: { error: 'offline-not-confirmed' } },
    });
    await act(() => sendPending());
    expect(entries()).toEqual([]);
    expect(sessionClosed.get()).toBe('offline-not-confirmed');
    expect(person.get()).toEqual(eva);
  });

  it('offline-E16: si la cuenta se dio de baja, el mensaje de no autorizada y la opción se apaga', async () => {
    ready();
    fakeFinger();
    await act(() => withOfflinePasskey());
    fakeServer({ '/api/sign-in/offline': { status: 401, body: { error: 'not-authorized' } } });
    await act(() => sendPending());
    expect(sessionClosed.get()).toBe('not-authorized');
    expect(permit.get()).toBeUndefined();
  });

  it('ya confirmada y la respuesta perdida: si la cookie llegó sigue; si no, la entrada', async () => {
    ready();
    fakeFinger();
    await act(() => withOfflinePasskey());
    const again = { status: 409, body: { error: 'offline-already-confirmed' } };
    fakeServer({ '/api/sign-in/offline': again, '/api/start': { body: { person: eva } } });
    await act(() => sendPending());
    expect(sessionClosed.get()).toBeUndefined();
    expect(offlineSession()).toBeUndefined();
    ready();
    await act(() => withOfflinePasskey());
    fakeServer({ '/api/sign-in/offline': again, '/api/start': { body: {} } });
    await act(() => sendPending());
    expect(sessionClosed.get()).toBe('offline-not-confirmed');
    act(() => sessionClosed.set(undefined));
    ready();
    await act(() => withOfflinePasskey());
    fakeServer({ '/api/sign-in/offline': again, '/api/start': 'offline' });
    await act(() => sendPending());
    expect(sessionClosed.get()).toBe('offline-not-confirmed');
  });

  it('offline-E21: salir sin conexión no la pierde: se manda sin abrir sesión', async () => {
    ready();
    fakeFinger();
    await act(() => withOfflinePasskey());
    // Otra entrada anterior, ya terminada, no cambia.
    const [first] = entries();
    fakeServer({ '/api/sign-out': 'offline' });
    await act(() => signOut());
    ready();
    await act(() => withOfflinePasskey());
    await act(() => signOut());
    expect(entries().map((entry) => entry.ended)).toEqual([true, true]);
    expect(entries()[0]?.id).toBe(first?.id);
    const server = fakeServer({ '/api/sign-in/offline': { body: { ended: true } } });
    await act(() => sendPending());
    expect(server.bodies('/api/sign-in/offline')[0]).toMatchObject({ openSession: false });
    expect(server.bodies('/api/sign-in/offline')).toHaveLength(2);
    expect(entries()).toEqual([]);
  });
});

describe('lo que el celular aprende del servidor', () => {
  beforeEach(resetOffline);
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('cada respuesta con sesión es un contacto; sin sesión o cerrada, no', () => {
    const stop = watchOffline();
    act(() => lastReply.set(1_000));
    expect(localStorage.getItem('offline-contact')).toBeNull();
    act(() => person.set(eva));
    act(() => lastReply.set(2_000));
    expect(JSON.parse(localStorage.getItem('offline-contact') as string).at).toBe(2_000);
    act(() => sessionClosed.set('idle'));
    act(() => lastReply.set(3_000));
    expect(JSON.parse(localStorage.getItem('offline-contact') as string).at).toBe(2_000);
    stop();
  });

  it('offline-E05: la sesión cerrada desde otro dispositivo frena; la baja o perder la opción, la apagan', () => {
    ready();
    const stop = watchOffline();
    act(() => sessionClosed.set('revoked'));
    expect(permit.get()?.revoked).toBe(true);
    act(() => sessionClosed.set('deactivated'));
    expect(permit.get()).toBeUndefined();
    ready();
    act(() => sessionClosed.set(undefined));
    act(() => person.set({ ...eva, name: 'Otra', userId: 'otra' }));
    expect(permit.get()).toBeDefined();
    const { offline: _, ...without } = eva;
    act(() => person.set(without));
    expect(permit.get()).toBeUndefined();
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
    expect(sessionClosed.get()).toBe('max-age');
    stop();
  });
});
