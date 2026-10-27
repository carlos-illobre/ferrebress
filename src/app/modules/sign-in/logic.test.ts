import 'fake-indexeddb/auto';
import { act, renderHook } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeServer } from '../../testing/fake-server.ts';
import { later } from '../../testing/later.ts';
import { minutes, noticeOf, useNotice } from './notice.ts';
import { codeOf, linkUrl, qrPath } from './qr.ts';
import { hasPasskey, offered, offerPasskey, person } from './session.ts';
import { ana, fakePasskeys, phone, signInReply } from './sign-in-test-kit.ts';
import { withGoogle, withPasskey } from './useSignIn.ts';
import { createPasskey, signWithPasskey } from './webauthn.ts';

describe('el aviso de la entrada', () => {
  afterEach(() => vi.useRealTimers());

  it('01-E02: traduce lo que contestó el servidor; lo demás no es un aviso', () => {
    expect(noticeOf({ ok: true, data: {} })).toBeUndefined();
    expect(noticeOf({ ok: false, error: 'not-authorized', email: 'x@y.com' })).toEqual({
      kind: 'not-authorized',
      email: 'x@y.com',
    });
    expect(noticeOf({ ok: false, error: 'not-authorized' })).toEqual({
      kind: 'not-authorized',
      email: '',
    });
    expect(noticeOf({ ok: false, error: 'too-many-attempts', retryAfterSeconds: 45 })).toEqual({
      kind: 'too-many',
      seconds: 45,
    });
    expect(noticeOf({ ok: false, error: 'offline' })).toBeUndefined();
  });

  it('01-E20: con demasiados intentos cuenta los segundos y al llegar a cero se va', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useNotice());
    act(() => result.current.setNotice({ kind: 'too-many', seconds: 2 }));
    await later(1000);
    expect(result.current.notice).toEqual({ kind: 'too-many', seconds: 1 });
    await later(1000);
    expect(result.current.notice).toBeUndefined();
    expect(minutes(75)).toBe('1:15');
  });
});

describe('el código QR', () => {
  it('lleva la dirección de la aplicación con el código después del #', () => {
    expect(linkUrl('abc')).toBe(`${location.origin}/link#abc`);
    const { size, d } = qrPath(linkUrl('abc'));
    expect(size).toBeGreaterThan(20);
    expect(d.startsWith('M0 0h1v1h-1z')).toBe(true);
  });

  it('de lo que lee la cámara, solo sirve un código de esta aplicación', () => {
    expect(codeOf(linkUrl('abc'))).toBe('abc');
    expect(codeOf(`${location.origin}/link`)).toBeUndefined();
    expect(codeOf('https://otro.sitio/link#abc')).toBeUndefined();
    expect(codeOf(`${location.origin}/otra#abc`)).toBeUndefined();
    expect(codeOf('no es una dirección')).toBeUndefined();
  });
});

describe('la huella del navegador', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('crea y usa la huella con el JSON del servidor', async () => {
    const credentials = fakePasskeys();
    expect(await createPasskey({ challenge: 'c' })).toEqual({ id: 'credencial' });
    expect(await signWithPasskey({ challenge: 'c' })).toEqual({ id: 'credencial' });
    expect(credentials.create).toHaveBeenCalledWith({ publicKey: { parsed: { challenge: 'c' } } });
  });

  it('si la persona cancela o no hay credencial, no devuelve nada', async () => {
    fakePasskeys({ cancel: true });
    expect(await createPasskey({})).toBeUndefined();
    expect(await signWithPasskey({})).toBeUndefined();
    const credentials = fakePasskeys();
    credentials.get.mockResolvedValueOnce(null as never);
    expect(await signWithPasskey({})).toBeUndefined();
  });
});

describe('entrar', () => {
  beforeEach(() => {
    localStorage.clear();
    person.set(undefined);
    offerPasskey.set(false);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('01-E05: con Google en la computadora entra, sin ofrecer la huella', async () => {
    const server = fakeServer({ '/api/sign-in/google': signInReply(true) });
    expect(await withGoogle('pase')).toBeUndefined();
    expect(person.get()).toEqual(ana);
    expect(offerPasskey.get()).toBe(false);
    expect(server.bodies('/api/sign-in/google')[0]).toMatchObject({ credential: 'pase' });
  });

  it('01-E06 y E08: en el celular sin huella se le ofrece, una sola vez', async () => {
    phone();
    fakeServer({
      '/api/sign-in/google': [signInReply(true), signInReply(false), signInReply(true)],
    });
    await withGoogle('pase');
    expect(offerPasskey.get()).toBe(true);
    offerPasskey.set(false);
    await withGoogle('pase');
    expect(offerPasskey.get()).toBe(false);
    offered();
    await withGoogle('pase');
    expect(offerPasskey.get()).toBe(false);
  });

  it('01-E02: una cuenta no autorizada no entra y dice por qué', async () => {
    fakeServer({
      '/api/sign-in/google': { status: 403, body: { error: 'not-authorized', email: 'x@y.com' } },
    });
    expect(await withGoogle('pase')).toEqual({ kind: 'not-authorized', email: 'x@y.com' });
    expect(person.get()).toBeUndefined();
  });

  it('01-E07: con la huella entra, y el celular sabe que la tiene', async () => {
    phone();
    fakePasskeys();
    fakeServer({
      '/api/sign-in/passkey/options': { body: { challenge: 'c' } },
      '/api/sign-in/passkey': signInReply(),
    });
    expect(await withPasskey()).toBeUndefined();
    expect(person.get()).toEqual(ana);
    expect(hasPasskey()).toBe(true);
  });

  it('con la huella: demasiados intentos, cancelar o la computadora no marcan nada', async () => {
    fakeServer({
      '/api/sign-in/passkey/options': {
        status: 429,
        body: { error: 'too-many-attempts', retryAfterSeconds: 9 },
      },
    });
    expect(await withPasskey()).toEqual({ kind: 'too-many', seconds: 9 });
    fakePasskeys({ cancel: true });
    fakeServer({ '/api/sign-in/passkey/options': { body: {} } });
    expect(await withPasskey()).toBeUndefined();
    fakePasskeys();
    fakeServer({
      '/api/sign-in/passkey/options': { body: {} },
      '/api/sign-in/passkey': signInReply(),
    });
    await withPasskey();
    expect(hasPasskey()).toBe(false);
  });
});
