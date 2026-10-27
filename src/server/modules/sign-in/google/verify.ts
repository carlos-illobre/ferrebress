// La verificación del pase de Google (diseño de 01, § 5 y § 13): firma con las llaves de Google,
// emisor, público, vencimiento, correo verificado y que traiga un `nonce`. Que el `nonce` sea uno
// que dio el servidor lo decide quien llama.
import { type JWTVerifyGetKey, jwtVerify } from 'jose';

export type GoogleIdentity = { subject: string; email: string; name: string; nonce: string };

export type GoogleSettings = { clientId: string; issuer: string; keys: JWTVerifyGetKey };

export async function verifyGoogle(
  credential: string,
  google: GoogleSettings,
): Promise<GoogleIdentity | undefined> {
  try {
    const { payload } = await jwtVerify(credential, google.keys, {
      // Google firma con uno de los dos nombres de su emisor.
      issuer: [google.issuer, google.issuer.replace(/^https:\/\//, '')],
      audience: google.clientId,
      algorithms: ['RS256'],
    });
    const { sub, email, email_verified: verified, name, nonce } = payload;
    if (!sub || typeof email !== 'string' || verified !== true || typeof nonce !== 'string')
      return undefined;
    return { subject: sub, email, name: typeof name === 'string' ? name : email, nonce };
  } catch {
    return undefined;
  }
}
