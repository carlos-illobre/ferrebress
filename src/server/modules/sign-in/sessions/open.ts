// Abrir una sesión, igual por los cuatro caminos (Google, la huella, la huella del celular al
// aprobar una computadora y el permiso de la computadora): la crea con la llave de prueba del
// dispositivo, deja la cookie y lo anota en la auditoría.
import type { Context } from 'hono';
import { Refused } from '../../../platform/http.ts';
import type { SignInContext } from '../context.ts';
import { deviceLabel, isPhone } from '../device.ts';
import { writeSessionCookie } from './cookie.ts';
import type { Way } from './data.ts';
import { isProofKey } from './proof.ts';

// La llave de prueba que mandó el dispositivo, si es una P-256 bien formada.
export function proofKeyOf(value: string | undefined): Uint8Array | undefined {
  const key = value === undefined ? undefined : Buffer.from(value, 'base64url');
  return key && isProofKey(key) ? key : undefined;
}

// Un cuerpo con la llave de prueba, para leerlo como paso de la ruta (`readBody`): válido según
// su esquema y con una llave que sirve; si no, nada (400).
export const withProofKey =
  <T extends { proofPublicKey: string }>(schema: {
    safeParse(raw: unknown): { success: true; data: T } | { success: false };
  }) =>
  (raw: unknown): (T & { proofKey: Uint8Array }) | undefined => {
    const parsed = schema.safeParse(raw);
    const proofKey = parsed.success ? proofKeyOf(parsed.data.proofPublicKey) : undefined;
    return parsed.success && proofKey ? { ...parsed.data, proofKey } : undefined;
  };

type Opening = {
  userId: string;
  proofPublicKey: Uint8Array;
  // Cómo entró, para la sesión (02, § 2) y para la auditoría.
  data: { method: Way; via?: string };
  googleAt?: Date;
  // La huella con la que entró, si entró con una.
  passkeyId?: string;
  // La computadora que entró con el QR: la huella del celular que la aprobó.
  approvedBy?: string;
  // El nombre del dispositivo; si no, el del navegador que pide.
  label?: string;
  // Lo que se contesta si la dieron de baja mientras entraba; si no, 401 `not-authorized`.
  refused?: Refused;
};

// Abre la sesión y recién después anota la entrada, solo si la persona sigue activa (02, § 5). Si la
// dieron de baja mientras entraba, la sesión recién creada se cierra: una baja a la vez o cerró esta
// sesión o la deja para que la cierre esto, nunca abierta.
export async function openSession(ctx: SignInContext, c: Context, opening: Opening) {
  const now = ctx.platform.clock.now();
  const fields = {
    userId: opening.userId,
    // Todo pedido trae el dispositivo: sin él, platform/http lo rechaza antes.
    deviceId: c.get('deviceId') as string,
    deviceLabel: opening.label ?? deviceLabel(c.req.header('User-Agent')),
    ipAddress: c.get('ipAddress'),
    proofPublicKey: opening.proofPublicKey,
    googleAt: opening.googleAt ?? null,
    way: opening.data.method,
    isPhone: isPhone(c.req.header('User-Agent'), c.req.header('Sec-CH-UA-Mobile')),
    passkeyId: opening.passkeyId ?? null,
    // La huella recién puesta (02 · R3.8); una entrada sin conexión la puso horas antes.
    passkeyAt: opening.passkeyId && opening.data.method !== 'offline' ? now : null,
    approvedBy: opening.approvedBy ?? null,
  };
  const created = await ctx.store.create(fields);
  if (!(await ctx.users.recordSignIn(opening.userId, now))) {
    await ctx.store.close(created.session.id, 'deactivated');
    throw opening.refused ?? new Refused(401, 'not-authorized');
  }
  ctx.store.remember(created);
  writeSessionCookie(c, created.token);
  ctx.record(c, 'sign-in.succeeded', { userId: opening.userId, data: opening.data });
  return created.session;
}
