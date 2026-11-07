// El dispositivo, atado a su llave (diseño de 01, § 6): al abrir una sesión, el dispositivo firma un
// `nonce` del servidor con la llave que el navegador no deja exportar. El identificador vale solo con
// la llave guardada para él; la primera vez que entra, se ata la que trae.
import { deviceProofHeaderName, deviceProofMessage } from '@ferrebress/shared/contracts/sign-in';
import type { Context } from 'hono';
import { Refused } from '../../../platform/http.ts';
import type { SignInContext } from '../context.ts';
import { isProofKey, verifyProof } from '../sessions/proof.ts';
import { devicesData } from './data.ts';

const bytes = (text: string | undefined) => Buffer.from(text ?? '', 'base64url');

// La cabecera: el `nonce`, la parte pública de la llave y la firma, separados por puntos.
function readProof(c: Context) {
  const [nonce, key, signature] = (c.req.header(deviceProofHeaderName) ?? '').split('.');
  // `split` siempre da al menos una parte: el `nonce` existe, aunque sea vacío.
  return { nonce: nonce as string, key: bytes(key), signature: bytes(signature) };
}

// Si el pedido prueba ser del dispositivo que dice, para la sesión que se abre con esa llave de prueba.
async function proven(ctx: SignInContext, c: Context, proofPublicKey: Uint8Array) {
  const deviceId = c.get('deviceId') as string;
  const { nonce, key, signature } = readProof(c);
  if (!ctx.deviceNonces.take(nonce) || !isProofKey(key)) return false;
  const message = deviceProofMessage(
    deviceId,
    nonce,
    Buffer.from(proofPublicKey).toString('base64url'),
  );
  if (!verifyProof(key, message, signature)) return false;
  return devicesData(ctx.platform.db as never).bindKey(deviceId, key, ctx.platform.clock.now());
}

// Sin la prueba no se abre la sesión: queda en la auditoría como un intento rechazado.
export async function proveDevice(
  ctx: SignInContext,
  c: Context,
  { proofPublicKey, method }: { proofPublicKey: Uint8Array; method: string },
) {
  if (await proven(ctx, c, proofPublicKey)) return;
  ctx.record(c, 'sign-in.rejected', { data: { method, reason: 'device-unproven' } });
  throw new Refused(401, 'device-unproven');
}
