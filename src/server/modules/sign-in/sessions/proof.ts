// La llave de prueba de cada sesión (ADR-015): la aplicación firma con la privada, que no puede
// exportar, lo que manda cuando la cookie no sirve (una salida pendiente; en el módulo 15, lo
// hecho sin conexión). Acá solo se verifica con la pública: ECDSA P-256 con SHA-256, la firma
// en el formato de WebCrypto (r‖s).
import { createPublicKey, type KeyObject, verify } from 'node:crypto';

function publicKeyOf(spki: Uint8Array): KeyObject | undefined {
  try {
    const key = createPublicKey({ key: Buffer.from(spki), format: 'der', type: 'spki' });
    return key.asymmetricKeyDetails?.namedCurve === 'prime256v1' ? key : undefined;
  } catch {
    return undefined;
  }
}

export const isProofKey = (spki: Uint8Array): boolean => publicKeyOf(spki) !== undefined;

export function verifyProof(spki: Uint8Array, message: string, signature: Uint8Array): boolean {
  const key = publicKeyOf(spki);
  return (
    !!key && verify('sha256', Buffer.from(message), { key, dsaEncoding: 'ieee-p1363' }, signature)
  );
}

export const signOutMessage = (sessionId: string): string => `sign-out:${sessionId}`;
