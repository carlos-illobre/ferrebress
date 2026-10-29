import 'fake-indexeddb/auto';
import { act } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionClosed } from '../../../platform/server/api.ts';
import { fakeServer } from '../../../testing/fake-server.ts';
import {
  allowOffline,
  offlineRejected,
  offlineSession,
  person,
  signOut,
  unknownToServer,
} from '../session.ts';
import { isOwn, withOfflinePasskey } from './enter.ts';
import { assertion, eva, fakeFinger, ready, resetOffline, signInReply } from './offline-kit.ts';
import { offlineOption } from './option.ts';
import { entries, pendingEntries } from './pending.ts';
import { sendPending } from './send.ts';

describe('entrar sin conexión con la huella', () => {
  beforeEach(resetOffline);
  afterEach(() => vi.unstubAllGlobals());

  it('sin sesión guardada, la huella recién vinculada no cambia a nadie, y un rechazo solo muestra la entrada', () => {
    allowOffline();
    expect(person.get()).toBeUndefined();
    offlineRejected('offline-not-confirmed');
    expect(sessionClosed.get()).toBe('offline-not-confirmed');
    expect(unknownToServer()).toBe(false);
  });

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
    expect(person.get()).toMatchObject({ userId: eva.userId, name: eva.name });
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
    expect(person.get()).toMatchObject({ userId: eva.userId, name: eva.name });
  });

  it('offline-E16: si la cuenta se dio de baja, el mensaje de no autorizada y la opción se apaga', async () => {
    ready();
    fakeFinger();
    await act(() => withOfflinePasskey());
    fakeServer({ '/api/sign-in/offline': { status: 401, body: { error: 'not-authorized' } } });
    await act(() => sendPending());
    expect(sessionClosed.get()).toBe('not-authorized');
    expect(offlineOption.get()).toBeUndefined();
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
