// Abrir una sesión, igual por los cuatro caminos (Google, la huella, la huella del celular al
// aprobar una computadora y el permiso de la computadora): la crea con la llave de prueba del
// dispositivo, deja la cookie y lo anota en la auditoría.
import type { Context } from 'hono';
import type { SignInContext } from '../context.ts';
import { deviceLabel } from '../device.ts';
import { writeSessionCookie } from './cookie.ts';
import { isProofKey } from './proof.ts';

// La llave de prueba que mandó el dispositivo, si es una P-256 bien formada.
export function proofKeyOf(value: string | undefined): Uint8Array | undefined {
  const key = value === undefined ? undefined : Buffer.from(value, 'base64url');
  return key && isProofKey(key) ? key : undefined;
}

type Opening = {
  userId: string;
  proofPublicKey: Uint8Array;
  // Cómo entró, para la auditoría.
  data: { method: string; via?: string };
  googleAt?: Date;
  // El nombre del dispositivo; si no, el del navegador que pide.
  label?: string;
};

export async function openSession(ctx: SignInContext, c: Context, opening: Opening) {
  const { token, session } = await ctx.store.create({
    userId: opening.userId,
    // Todo pedido trae el dispositivo: sin él, platform/http lo rechaza antes.
    deviceId: c.get('deviceId') as string,
    deviceLabel: opening.label ?? deviceLabel(c.req.header('User-Agent')),
    ipAddress: c.get('ipAddress'),
    proofPublicKey: opening.proofPublicKey,
    googleAt: opening.googleAt ?? null,
  });
  writeSessionCookie(c, token);
  ctx.record(c, 'sign-in.succeeded', { userId: opening.userId, data: opening.data });
  return session;
}
