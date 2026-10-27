import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { isProofKey, verifyProof } from './proof.ts';

function keyPair(namedCurve = 'prime256v1') {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve });
  const spki = publicKey.export({ format: 'der', type: 'spki' });
  const signer = (message: string) =>
    sign('sha256', Buffer.from(message), { key: privateKey, dsaEncoding: 'ieee-p1363' });
  return { spki, signer };
}

describe('la llave de prueba', () => {
  it('acepta la firma de su llave privada, y ninguna otra', () => {
    const own = keyPair();
    const other = keyPair();
    expect(verifyProof(own.spki, 'hola', own.signer('hola'))).toBe(true);
    expect(verifyProof(own.spki, 'chau', own.signer('hola'))).toBe(false);
    expect(verifyProof(own.spki, 'hola', other.signer('hola'))).toBe(false);
  });

  it('solo acepta llaves públicas P-256', () => {
    expect(isProofKey(keyPair().spki)).toBe(true);
    expect(isProofKey(keyPair('secp384r1').spki)).toBe(false);
    expect(isProofKey(new Uint8Array([1, 2, 3]))).toBe(false);
    expect(verifyProof(new Uint8Array([1]), 'hola', new Uint8Array([1]))).toBe(false);
  });
});
