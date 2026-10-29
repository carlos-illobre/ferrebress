// Entrar sin conexión con la huella del celular (diseño de 15, § 4): la forma de la confirmación
// que la aplicación manda al volver la conexión, y el desafío que firma la huella, que arman igual
// el celular y el servidor. El desafío ata la firma a esa entrada: cambiar cualquier dato después
// de firmar da otro desafío, y la firma deja de servir. La huella no va en el desafío: la firma
// solo verifica con la llave de la huella que la hizo.
import * as z from 'zod/mini';

const base64url = (max: number) =>
  z.string().check(z.minLength(1), z.maxLength(max), z.regex(/^[A-Za-z0-9_-]+$/));

// Una hora del celular, como la da `toISOString()`: solo se guarda, no decide nada.
const isoTime = z.iso.datetime();

// La respuesta de la huella, como mucho de 8 KB, como al entrar con conexión.
const webAuthnResponse = z
  .record(z.string(), z.unknown())
  .check(z.refine((value) => JSON.stringify(value).length <= 8 * 1024));

export const offlineSignInBody = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  signedAt: isoTime,
  lastContactAt: isoTime,
  // Si es la sesión que la persona tiene ahora en el celular: si salió o entró otra, se confirma
  // sin abrir nada.
  openSession: z.boolean(),
  response: webAuthnResponse,
  proofPublicKey: base64url(256),
});

export type OfflineSignInBody = z.infer<typeof offlineSignInBody>;

export type OfflineChallengeFields = {
  id: string;
  userId: string;
  deviceId: string;
  signedAt: string;
  lastContactAt: string;
};

// Siempre en este orden, para que el texto sea el mismo en los dos lados.
const order: (keyof OfflineChallengeFields)[] = [
  'id',
  'userId',
  'deviceId',
  'signedAt',
  'lastContactAt',
];

const base64urlOf = (bytes: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

// El desafío de una entrada sin conexión: SHA-256 del JSON con las claves en orden, en base64url.
export async function offlineChallenge(fields: OfflineChallengeFields): Promise<string> {
  const text = JSON.stringify(order.map((key) => [key, fields[key]]));
  return base64urlOf(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}
