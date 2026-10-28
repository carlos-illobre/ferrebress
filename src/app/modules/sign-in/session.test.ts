import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProofKey } from '../../platform/device/proof-key.ts';
import { readStored } from '../../platform/device/storage.ts';
import { fakeServer } from '../../testing/fake-server.ts';
import { registerWork } from '../frame/index.ts';
import {
  confirmed,
  hasPasskey,
  offered,
  passkeyLinked,
  person,
  sendPendingSignOut,
  signedIn,
  signOut,
  wasOffered,
} from './session.ts';

const ana = { userId: 'u1', name: 'Ana Gómez', email: 'ana@example.com', role: 'Administrador' };
const sessionId = '0190a000-0000-7000-8000-000000000001';

describe('la sesión en la aplicación', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('al entrar guarda quién es, para mostrarlo sin conexión', () => {
    signedIn({ person: ana, sessionId, offerPasskey: false });
    expect(person.get()).toEqual(ana);
    expect(readStored('session')).toEqual({ sessionId, person: ana });
  });

  it('al abrir, lo que dice el servidor manda: otra persona, la misma o nadie', () => {
    signedIn({ person: ana, sessionId, offerPasskey: false });
    confirmed({ ...ana, name: 'Ana G.' });
    expect(readStored('session')).toEqual({ sessionId, person: { ...ana, name: 'Ana G.' } });
    confirmed({ ...ana, userId: 'u2' });
    expect(readStored('session')).toEqual({ person: { ...ana, userId: 'u2' } });
    confirmed(undefined);
    expect(readStored('session')).toBeUndefined();
    expect(person.get()).toBeUndefined();
    confirmed(ana);
    expect(readStored('session')).toEqual({ person: ana });
  });

  it('sign-in-E25, E26: después de una sesión vencida, la misma persona sigue; otra descarta lo de antes', () => {
    const discard = vi.fn();
    const stop = registerWork({ pending: () => true, discard });
    signedIn({ person: ana, sessionId, offerPasskey: false });
    signedIn({ person: { ...ana }, sessionId, offerPasskey: false });
    expect(discard).not.toHaveBeenCalled();
    signedIn({ person: { ...ana, userId: 'u2' }, sessionId, offerPasskey: false });
    expect(discard).toHaveBeenCalledOnce();
    stop();
  });

  it('sign-in-E35: salir con conexión cierra la sesión en el servidor y no deja nada pendiente', async () => {
    const server = fakeServer({ '/api/sign-out': { body: { ok: true } } });
    signedIn({ person: ana, sessionId, offerPasskey: false });
    await signOut();
    expect(person.get()).toBeUndefined();
    expect(server.bodies('/api/sign-out')).toEqual([{}]);
    expect(readStored('pending-sign-out')).toBeUndefined();
  });

  it('sign-in-E36: sin conexión sale al instante y deja la salida firmada, que se manda al volver', async () => {
    await createProofKey();
    fakeServer({ '/api/sign-out': 'offline' });
    signedIn({ person: ana, sessionId, offerPasskey: false });
    await signOut();
    const pending = readStored<{ sessionId: string; tappedAt: number }>('pending-sign-out');
    expect(pending?.sessionId).toBe(sessionId);
    expect(pending?.tappedAt).toBeTypeOf('number');
    await sendPendingSignOut();
    expect(readStored('pending-sign-out')).toEqual(pending);
    const server = fakeServer({ '/api/sign-out': { body: { ok: true } } });
    await sendPendingSignOut();
    expect(server.bodies('/api/sign-out')).toEqual([{ pending }]);
    expect(readStored('pending-sign-out')).toBeUndefined();
    await sendPendingSignOut();
    expect(server.sent).toHaveLength(1);
  });

  it('sin conexión y sin la sesión guardada, o sin la llave, no queda nada pendiente', async () => {
    fakeServer({ '/api/sign-out': 'offline' });
    confirmed(ana);
    await signOut();
    expect(readStored('pending-sign-out')).toBeUndefined();
    signedIn({ person: ana, sessionId, offerPasskey: false });
    await signOut();
    expect(readStored('pending-sign-out')).toBeUndefined();
  });

  it('recuerda si el celular tiene huella y a quién ya se le ofreció, por persona (R2.2)', () => {
    expect(hasPasskey()).toBe(false);
    expect(wasOffered('u1')).toBe(false);
    passkeyLinked();
    offered('u1');
    offered('u1');
    expect(hasPasskey()).toBe(true);
    expect(wasOffered('u1')).toBe(true);
    // A otra persona que entra después en el mismo celular se le ofrece igual.
    expect(wasOffered('u2')).toBe(false);
    expect(readStored('passkey-offered-to')).toEqual(['u1']);
  });
});
