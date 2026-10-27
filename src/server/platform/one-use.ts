// Valores de un solo uso que vencen solos, en memoria (diseño de 01, § 8): los `nonce` de Google,
// los desafíos de la huella. Con un tope total y otro por dueño (una dirección de internet), así
// nadie llena la memoria ni le saca el lugar a los demás; al llegar a un tope se rechaza lo nuevo
// y nunca se saca lo que ya estaba.
import { randomBytes } from 'node:crypto';
import type { Clock } from './clock.ts';

export type OneUseLimits = { ttlMs: number; maxTotal: number; maxPerOwner: number };

export function createOneUse<T>(clock: Clock, limits: OneUseLimits) {
  const entries = new Map<string, { owner: string; value: T; expiresAt: number }>();
  const sweep = (now: number) => {
    for (const [key, entry] of entries) if (entry.expiresAt <= now) entries.delete(key);
  };
  const countOf = (owner: string) =>
    [...entries.values()].filter((entry) => entry.owner === owner).length;

  return {
    // Una clave nueva al azar, o undefined si se llegó a un tope.
    issue(owner: string, value: T): string | undefined {
      const now = clock.now().getTime();
      sweep(now);
      if (entries.size >= limits.maxTotal || countOf(owner) >= limits.maxPerOwner) return undefined;
      const key = randomBytes(24).toString('base64url');
      entries.set(key, { owner, value, expiresAt: now + limits.ttlMs });
      return key;
    },

    // El valor de la clave, una sola vez y si no venció.
    take(key: string): T | undefined {
      const entry = entries.get(key);
      entries.delete(key);
      return entry && entry.expiresAt > clock.now().getTime() ? entry.value : undefined;
    },
  };
}
