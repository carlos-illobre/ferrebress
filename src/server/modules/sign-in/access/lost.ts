// «Se perdió un celular» (02 · R5.7): las personas que tienen algún celular para cortar y, de cada
// una, sus celulares (con una sesión abierta en un celular o con su huella), sin el que se está
// usando. Cada celular se nombra con un identificador opaco: el de su huella o el de su sesión.
import type { LostPhone, LostPhonesResponse } from '@ferrebress/shared/contracts/users';
import type { RequestSession } from '../../../platform/session.ts';
import type { SignInContext } from '../context.ts';
import { signInSettings } from '../settings.ts';
import type { AccessData } from './data.ts';

type Phone = LostPhone & { userId: string; deviceId: string };

const newer = (a: number | null, b: Date) => Math.max(a ?? 0, b.getTime());

export async function lostPhones(
  ctx: SignInContext,
  data: AccessData,
  asking: RequestSession,
  now: Date,
): Promise<LostPhonesResponse> {
  const [sessions, passkeys] = await Promise.all([
    data.openPhoneSessions(now, signInSettings.session),
    data.allPasskeys(),
  ]);
  const phones = new Map<string, Phone>();
  for (const p of passkeys) {
    phones.set(`${p.userId}:${p.deviceId}`, {
      ...{ id: p.publicId, userId: p.userId, deviceId: p.deviceId, deviceLabel: p.deviceLabel },
      ...{ sessions: 0, passkey: true, lastUsedAt: p.lastUsedAt?.getTime() ?? null },
    });
  }
  for (const s of sessions) {
    const key = `${s.userId}:${s.deviceId}`;
    const phone = phones.get(key) ?? {
      ...{ id: s.id, userId: s.userId, deviceId: s.deviceId, deviceLabel: s.deviceLabel },
      ...{ sessions: 0, passkey: false, lastUsedAt: null },
    };
    phones.set(key, {
      ...phone,
      sessions: phone.sessions + 1,
      lastUsedAt: newer(phone.lastUsedAt, s.lastUsedAt),
    });
  }
  const mine = (phone: Phone) => phone.deviceId === asking.deviceId;
  const byUser = Map.groupBy(
    [...phones.values()].filter((p) => !mine(p)),
    (p) => p.userId,
  );
  const names = await ctx.people.ofMany([...byUser.keys()]);
  const people = [...byUser].map(([userId, list]) => ({
    userId,
    displayName: names.get(userId)?.name as string,
    self: userId === asking.userId,
    phones: list.map(({ userId: _, deviceId: __, ...phone }) => phone),
  }));
  return { people };
}
