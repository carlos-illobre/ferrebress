// Cuándo vence un vínculo (R2.2; 06 · R7): a los días que fija Administración desde la última vez que
// los dos espejaron. Se termina en su próximo contacto con el servidor, no solo en la limpieza diaria:
// así también con 1 día dura lo que dice (diseño de 06, § 5). Antes de limpiar se escribe lo espejado
// que quedó en memoria, así no se borra uno que acaba de espejar.
import type { DeviceLinkContext } from './context.ts';
import { afterEnding, recordEnded } from './lifecycle.ts';
import { isDue, type Pairing } from './rules.ts';

// La última vez que espejaron, por tandas (R2.2).
export async function flushMirrored(ctx: DeviceLinkContext): Promise<void> {
  const entries = ctx.members.drainMirrored();
  if (entries.length > 0) await ctx.data.touch(entries);
}

// Termina y anota los vínculos vencidos.
export async function expireDue(ctx: DeviceLinkContext): Promise<void> {
  await flushMirrored(ctx);
  const day = 24 * 60 * 60_000;
  const before = new Date(ctx.platform.clock.now().getTime() - ctx.pairingDays() * day);
  const expired = await ctx.data.removeOlderThan(before);
  afterEnding(ctx, expired);
  recordEnded(ctx, expired, 'expired');
}

// El vínculo de esa persona en ese dispositivo, o ninguno; si ya venció, lo termina antes.
export async function pairingOf(
  ctx: DeviceLinkContext,
  userId: string,
  deviceId: string,
): Promise<Pairing | null> {
  const pairing = await ctx.members.pairingOf(userId, deviceId);
  if (!pairing) return null;
  const mirrored = ctx.members.mirroredAt(pairing.id) ?? pairing.mirroredAt;
  const now = ctx.platform.clock.now().getTime();
  if (!isDue(mirrored.getTime(), ctx.pairingDays(), now)) return pairing;
  await expireDue(ctx);
  // Si sigue, la memoria tenía una fecha vieja: se pone al día con la de la base.
  const fresh = (await ctx.data.forDevice(userId, deviceId)) ?? null;
  if (fresh) ctx.members.known(fresh);
  return fresh;
}
