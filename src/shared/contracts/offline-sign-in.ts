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
  // sin abrir nada. Para abrirla, la firma de la llave de prueba (que no se puede copiar) sobre
  // `offlineOpenMessage(id)`: quien copie la entrada guardada no puede abrir la sesión.
  openSession: z.boolean(),
  openSignature: z.optional(base64url(200)),
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
  // La llave de prueba de esa entrada: la firma de la huella la ata a ella.
  proofPublicKey: string;
};

// Siempre en este orden, para que el texto sea el mismo en los dos lados.
const order: (keyof OfflineChallengeFields)[] = [
  'id',
  'userId',
  'deviceId',
  'signedAt',
  'lastContactAt',
  'proofPublicKey',
];

const base64urlOf = (bytes: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

// Cuánto se puede entrar sin conexión desde el último contacto con sesión (15 · R2.2).
export const offlineWindowHours = 24;

// Lo que firma la llave de prueba para que la confirmación abra la sesión.
export const offlineOpenMessage = (id: string): string => `offline-open:${id}`;

// El desafío de una entrada sin conexión: SHA-256 del JSON con las claves en orden, en base64url.
export async function offlineChallenge(fields: OfflineChallengeFields): Promise<string> {
  const text = JSON.stringify(order.map((key) => [key, fields[key]]));
  return base64urlOf(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}
