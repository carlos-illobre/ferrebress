import 'fake-indexeddb/auto';
import { deviceProofHeaderName } from '@ferrebress/shared/contracts/sign-in';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeServer } from '../../testing/fake-server.ts';
import { signInApi } from './api.ts';

const headerOf = (call: unknown[]) =>
  new Headers((call[1] as RequestInit).headers).get(deviceProofHeaderName);

describe('lo que abre una sesión, con la prueba del dispositivo (diseño de 01, § 6)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('firma el nonce con la llave del dispositivo y la manda en la cabecera', async () => {
    fakeServer({ '/api/sign-in/google': { body: { ok: true } } });
    await signInApi.google('pase', 'prueba');
    const call = vi.mocked(fetch).mock.calls.find(([path]) => path === '/api/sign-in/google');
    const [nonce, key, signature] = String(headerOf(call as unknown[])).split('.');
    expect(nonce).toBe('n');
    expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(signature).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('sin nonce (demasiados pedidos), no intenta entrar y devuelve el rechazo', async () => {
    const server = fakeServer({
      '/api/sign-in/device-nonce': { status: 429, body: { error: 'too-many-requests' } },
    });
    const result = await signInApi.google('pase', 'prueba');
    expect(result.ok).toBe(false);
    expect(server.sent.map((s) => s.path)).toEqual(['/api/sign-in/device-nonce']);
  });
});
