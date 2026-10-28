// Valores de un solo uso que vencen solos, en memoria (diseño de 01, § 8): los `nonce` de Google,
// los desafíos de la huella. Con un tope total y otro por dueño (una dirección de internet), así
// nadie llena la memoria ni le saca el lugar a los demás. Al llegar al tope total se rechaza lo
// nuevo; al llegar al del dueño también, salvo con `replaceOldest`: entonces se descarta el más viejo
// de ese mismo dueño (los `nonce`, que se piden con cada carga de la entrada y no son intentos).
import { randomBytes } from 'node:crypto';
import type { Clock } from '../clock.ts';

export type OneUseLimits = {
  ttlMs: number;
  maxTotal: number;
  maxPerOwner: number;
  replaceOldest?: boolean;
};

export function createOneUse<T>(clock: Clock, limits: OneUseLimits) {
  const entries = new Map<string, { owner: string; value: T; expiresAt: number }>();
  const sweep = (now: number) => {
    for (const [key, entry] of entries) if (entry.expiresAt <= now) entries.delete(key);
  };
  const keysOf = (owner: string) =>
    [...entries].filter(([, entry]) => entry.owner === owner).map(([key]) => key);
  // Hace lugar para uno más del dueño; false si no se puede.
  const room = (owner: string) => {
    const own = keysOf(owner);
    if (own.length < limits.maxPerOwner) return true;
    if (!limits.replaceOldest) return false;
    entries.delete(own[0] as string);
    return true;
  };

  return {
    // Una clave nueva al azar, o undefined si se llegó a un tope.
    issue(owner: string, value: T): string | undefined {
      const now = clock.now().getTime();
      sweep(now);
      if (entries.size >= limits.maxTotal || !room(owner)) return undefined;
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
