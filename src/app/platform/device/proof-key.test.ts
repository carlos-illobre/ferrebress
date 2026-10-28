import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { createProofKey, forgetProofKey, signWithProofKey } from './proof-key.ts';

const fromBase64url = (text: string) =>
  Uint8Array.from(atob(text.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));

describe('la llave de prueba de la sesión', () => {
  it('firma con la privada lo que el servidor verifica con la pública', async () => {
    const spki = await createProofKey();
    const signature = (await signWithProofKey('sign-out:abc')) as string;
    const publicKey = await crypto.subtle.importKey(
      'spki',
      fromBase64url(spki),
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      publicKey,
      fromBase64url(signature),
      new TextEncoder().encode('sign-out:abc'),
    );
    expect(ok).toBe(true);
  });

  it('la privada no se puede exportar', async () => {
    await createProofKey();
    const generate = vi.spyOn(crypto.subtle, 'generateKey');
    await createProofKey();
    expect(generate.mock.calls[0]?.[1]).toBe(false);
  });

  it('al salir se olvida, y sin llave no hay firma', async () => {
    await createProofKey();
    await forgetProofKey();
    expect(await signWithProofKey('x')).toBeUndefined();
  });

  it('si el navegador no puede abrir su base, falla', async () => {
    vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      const request = { error: new Error('sin lugar') } as unknown as IDBOpenDBRequest;
      setTimeout(() => request.onerror?.(new Event('error')));
      return request;
    });
    await expect(signWithProofKey('x')).rejects.toThrow('sin lugar');
    vi.restoreAllMocks();
  });
});
