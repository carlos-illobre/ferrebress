// Cómo nace y cómo termina un vínculo (capítulo 03, R1 y R2; diseño de 03, § 10 y § 11): lo escrito
// va en una transacción, y lo de después de confirmarla (la memoria, soltar las claves del canal, la
// auditoría) se devuelve para correrlo recién entonces. Un solo camino para todos los que lo usan:
// el botón, la entrada con el celular, desvincular y los avisos de otros módulos.
import type { Side } from '@ferrebress/shared/contracts/device-link';
import { newId } from '../../platform/ids.ts';
import type { Actor } from '../../platform/storage/audit/event.ts';
import { type DeviceLinkContext, targetsOf } from './context.ts';
import type { DeviceLinkData } from './data.ts';
import { type Device, type EndReason, isSamePair, type Pairing, replacedBy } from './rules.ts';

export const pairingTopic = 'device-link.pairing';
export const keyOf = (pairingId: string, side: Side) => `${pairingId}:${side}`;

// Lo de después de confirmar: olvidar lo que se sabía de esos vínculos y soltar sus claves del canal,
// así nadie queda escuchando un vínculo que ya no existe.
export function afterEnding(ctx: DeviceLinkContext, ended: Pairing[]): void {
  ctx.members.ended(ended);
  for (const pairing of ended)
    for (const side of ['phone', 'computer'] as const)
      ctx.platform.realtime.drop(pairingTopic, keyOf(pairing.id, side));
}

// Anota un vínculo que terminó solo, con el motivo (R8.1).
export function recordEnded(ctx: DeviceLinkContext, ended: Pairing[], reason: EndReason): void {
  for (const pairing of ended)
    ctx.platform.audit.record({
      type: 'device-link.ended',
      at: ctx.platform.clock.now(),
      actor: { kind: 'system' },
      targets: [{ kind: 'person', id: pairing.userId }, ...targetsOf(pairing, ctx.names)],
      data: { reason },
    });
}

export type Paired = { pairing: Pairing; replaced: Pairing[]; renewed: boolean };
// Lo que dice si se puede reemplazar lo que hay: con el botón, se pregunta antes (R1.4); al entrar a
// la computadora con el celular, no (R1.5).
export type MayReplace = (replaced: Pairing[]) => boolean;

// Vincula esos dos dispositivos, terminando los vínculos que reemplaza (R1.1), si `mayReplace` lo
// deja; si no, devuelve los que habría reemplazado. Si ya eran ellos, lo renueva (R2.2). Dentro de la
// transacción de quien llama: leer y escribir no se separan.
export async function pair(
  data: DeviceLinkData,
  devices: { phone: Device; computer: Device },
  how: Pairing['pairedBy'],
  now: Date,
  mayReplace: MayReplace = () => true,
): Promise<Paired | { refused: Pairing[] }> {
  const { phone, computer } = devices;
  const existing = await data.forDevices(phone.userId, [phone.deviceId, computer.deviceId]);
  const same = existing.find((pairing) => isSamePair(pairing, phone, computer));
  if (same) {
    await data.touch([[same.id, now]]);
    return { pairing: { ...same, mirroredAt: now }, replaced: [], renewed: true };
  }
  const replacing = replacedBy(existing, phone, computer);
  if (!mayReplace(replacing)) return { refused: replacing };
  const replaced = await data.remove(replacing.map((p) => p.id));
  const pairing: Pairing = {
    id: newId({ now: () => now }),
    userId: phone.userId,
    phoneDeviceId: phone.deviceId,
    computerDeviceId: computer.deviceId,
    phoneLabel: phone.label,
    computerLabel: computer.label,
    pairedBy: how,
    createdAt: now,
    mirroredAt: now,
    pausedAt: null,
  };
  await data.insert(pairing);
  return { pairing, replaced, renewed: false };
}

// Lo de después de vincular: la memoria, las claves de los que terminaron y la auditoría. Renovar el
// mismo vínculo no corta nada: el espejo que andaba sigue.
export function afterPairing(ctx: DeviceLinkContext, paired: Paired, actor: Actor): void {
  const { pairing, replaced, renewed } = paired;
  afterEnding(ctx, replaced);
  ctx.members.known(pairing);
  if (renewed) return;
  const at = ctx.platform.clock.now();
  const person = { kind: 'person', id: pairing.userId };
  for (const old of replaced)
    ctx.platform.audit.record({
      type: 'device-link.replaced',
      at,
      actor,
      targets: [person, ...targetsOf(old, ctx.names)],
      data: { how: pairing.pairedBy },
    });
  ctx.platform.audit.record({
    type: 'device-link.paired',
    at,
    actor,
    targets: [person, ...targetsOf(pairing, ctx.names)],
    data: { how: pairing.pairedBy },
  });
}
