// Una huella de prueba (diseño de 01, § 12): crea credenciales y firma desafíos como el
// autenticador de un celular, para probar el servidor sin hardware. Cada prueba elige si pone la
// huella de verdad (verificación) y qué contador manda.
import { createHash, generateKeyPairSync, type KeyObject, randomBytes, sign } from 'node:crypto';
import { isoCBOR } from '@simplewebauthn/server/helpers';

const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64url');
const sha256 = (data: Uint8Array | string) => createHash('sha256').update(data).digest();

type Flags = { userVerified?: boolean; counter?: number };

function authenticatorData(
  rpId: string,
  { userVerified = true, counter = 0 }: Flags,
  attested?: Uint8Array,
) {
  // Presente (0x01), verificado con la huella (0x04) y, al crear, con la credencial (0x40).
  const flags = 0x01 | (userVerified ? 0x04 : 0) | (attested ? 0x40 : 0);
  const count = Buffer.alloc(4);
  count.writeUInt32BE(counter);
  return Buffer.concat([
    sha256(rpId),
    Buffer.from([flags]),
    count,
    ...(attested ? [attested] : []),
  ]);
}

function coseKey(publicKey: KeyObject): Uint8Array {
  const jwk = publicKey.export({ format: 'jwk' });
  const key = new Map<number, number | Uint8Array>([
    [1, 2],
    [3, -7],
    [-1, 1],
    [-2, Buffer.from(jwk.x as string, 'base64url')],
    [-3, Buffer.from(jwk.y as string, 'base64url')],
  ]);
  return isoCBOR.encode(key);
}

const clientData = (type: string, challenge: string, origin: string) =>
  Buffer.from(JSON.stringify({ type, challenge, origin, crossOrigin: false }));

type Keys = {
  rpId: string;
  origin: string;
  credentialId: Buffer;
  publicKey: KeyObject;
  privateKey: KeyObject;
};

const wrap = (keys: Keys, response: Record<string, unknown>) => ({
  id: b64(keys.credentialId),
  rawId: b64(keys.credentialId),
  type: 'public-key',
  response,
  clientExtensionResults: {},
  authenticatorAttachment: 'platform',
});

// Lo que devuelve navigator.credentials.create().
function createResponse(keys: Keys, challenge: string, flags: Flags) {
  const length = Buffer.alloc(2);
  length.writeUInt16BE(keys.credentialId.length);
  const attested = Buffer.concat([
    Buffer.alloc(16),
    length,
    keys.credentialId,
    coseKey(keys.publicKey),
  ]);
  const authData = authenticatorData(keys.rpId, flags, attested);
  const attestation = new Map<string, unknown>([
    ['fmt', 'none'],
    ['attStmt', new Map()],
    ['authData', authData],
  ]);
  return wrap(keys, {
    clientDataJSON: b64(clientData('webauthn.create', challenge, keys.origin)),
    attestationObject: b64(isoCBOR.encode(attestation as never)),
    transports: ['internal'],
  });
}

// Lo que devuelve navigator.credentials.get().
function getResponse(keys: Keys, challenge: string, flags: Flags, userHandle: string) {
  const data = authenticatorData(keys.rpId, flags);
  const client = clientData('webauthn.get', challenge, keys.origin);
  const signature = sign('sha256', Buffer.concat([data, sha256(client)]), keys.privateKey);
  return wrap(keys, {
    clientDataJSON: b64(client),
    authenticatorData: b64(data),
    signature: b64(signature),
    userHandle,
  }) as ReturnType<typeof wrap> & { response: { signature: string } };
}

export function createAuthenticator(origin: string) {
  const { publicKey, privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const keys = {
    rpId: new URL(origin).hostname,
    origin,
    credentialId: randomBytes(16),
    publicKey,
    privateKey,
  };
  let userHandle = '';
  return {
    credentialId: b64(keys.credentialId),
    create(options: { challenge: string; user: { id: string } }, flags: Flags = {}) {
      userHandle = options.user.id;
      return createResponse(keys, options.challenge, flags);
    },
    get: (options: { challenge: string }, flags: Flags = {}) =>
      getResponse(keys, options.challenge, flags, userHandle),
  };
}

export type Authenticator = ReturnType<typeof createAuthenticator>;
