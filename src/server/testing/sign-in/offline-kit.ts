// Lo que usan las pruebas de entrar sin conexión (diseño de 15, § 11): un celular con la huella de
// una cuenta nueva vinculada, la entrada que arma ese celular sin conexión, firmada con la huella,
// y la fila que guardó el servidor. `clock.now` es el reloj del servidor, que mueve cada prueba.
import { randomUUID } from 'node:crypto';
import { offlineChallenge, offlineOpenMessage } from '@ferrebress/shared/contracts/offline-sign-in';
import { sql } from 'kysely';
import { testConfig } from '../config.ts';
import { type Authenticator, createAuthenticator } from './authenticator.ts';
import { createDevice, createSignInServer, type SignInServer } from './sign-in-server.ts';

export const androidPhone =
  'Mozilla/5.0 (Linux; Android 14; moto e13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36';
export const hours = (n: number) => n * 3_600_000;

type Device = ReturnType<typeof createDevice>;
// Lo que cambia la prueba en lo que se firma.
type Signed = { lastContactAt?: string; signedAt?: string };
type Signer = { phone: Device; authenticator: Authenticator; userId: string };

// La entrada que arma el celular sin conexión, firmada con la huella. `signed` cambia lo que se
// firma; `change`, lo que se manda después de firmar.
async function signEntry(
  now: number,
  { phone, authenticator, userId }: Signer,
  change: object,
  signed: Signed,
) {
  const fields = {
    id: randomUUID(),
    userId,
    signedAt: new Date(now).toISOString(),
    lastContactAt: new Date(now - hours(1)).toISOString(),
    proofPublicKey: phone.proofPublicKey,
    ...signed,
  };
  const challenge = await offlineChallenge({ ...fields, deviceId: phone.id });
  return {
    ...fields,
    openSession: true,
    // La llave de prueba del celular, que no se puede copiar, firma que puede abrir la sesión.
    openSignature: phone.prove(offlineOpenMessage(fields.id)),
    response: authenticator.get({ challenge }),
    ...change,
  };
}

// La fila que guardó el servidor de una entrada, y lo que quedó en la auditoría.
function inspect(server: SignInServer) {
  const rowOf = async (id: string) =>
    (
      await sql<{
        result: string;
        reason: string | null;
      }>`select result, reason from sign_in.offline_sign_ins where id = ${id}`.execute(
        server.platform.db,
      )
    ).rows[0];

  // Lo que quedó en la auditoría de una entrada.
  const auditOf = (id: string) =>
    server.platform.audit.read(2026).find((event) => event.data?.id === id);
  return { rowOf, auditOf };
}

export async function createOfflineKit() {
  const clock = { now: new Date('2026-10-29T08:00:00Z').getTime() };
  const server: SignInServer = await createSignInServer({ now: () => new Date(clock.now) });
  let ip = 0;
  let account = 0;

  // Una cuenta autorizada, como la dará de alta el módulo 02.
  const authorize = (email: string) =>
    sql`insert into users.users (id, email, active, created_at)
      values (${randomUUID()}, ${email}, true, now())`.execute(server.platform.db);

  const newAccount = async () => {
    const claims = { sub: `sub-${++account}`, email: `persona${account}@example.com` };
    await authorize(claims.email);
    return claims;
  };

  // Un celular con la huella de una cuenta nueva vinculada y la sesión abierta.
  async function linkedPhone() {
    const claims = await newAccount();
    const phone = createDevice(server, { userAgent: androidPhone, ip: `181.2.0.${++ip}` });
    const google = await phone.signInWithGoogle(claims);
    const authenticator = createAuthenticator(testConfig.PUBLIC_ORIGIN);
    const options = await phone.request('/api/passkeys/options', {});
    const linked = await phone.request('/api/passkeys', {
      response: authenticator.create(options.body),
    });
    return { phone, authenticator, claims, userId: google.body.person.userId as string, linked };
  }

  const send = (linked: { phone: Device }, body: unknown) =>
    linked.phone.request('/api/sign-in/offline', body);
  const offlineEntry = (linked: Signer, change = {}, signed: Signed = {}) =>
    signEntry(clock.now, linked, change, signed);
  return { clock, server, newAccount, linkedPhone, offlineEntry, send, ...inspect(server) };
}
