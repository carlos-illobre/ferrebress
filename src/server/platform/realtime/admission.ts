// Los topes del canal (diseño de 03, § 3.3): con sesión se cuenta por sesión y sin sesión por red,
// así un desconocido detrás del mismo NAT no deja sin canal a las computadoras del local; los
// anónimos tienen su propio tope dentro del total y nunca le sacan lugar a quien tiene sesión.
import type { RateLimiter } from '../limits/rate-limit.ts';
import type { Channel, Owner } from './channel.ts';

export const realtimeSettings = {
  // El latido: un corte se nota en menos de un minuto (03 · R7.2); la aplicación espera 55 s.
  beatEveryMs: 40_000,
  // Lo que puede quedar sin escribir antes de dar a un oyente por lento.
  maxPendingBytes: 256 * 1024,
  maxTopicsPerChannel: 16,
  channels: { perSession: 4, perAnonymousNetwork: 3, total: 2000, anonymousTotal: 200 },
  opens: { max: 10, windowMs: 60_000 },
  subscriptionChanges: { max: 60, windowMs: 60_000 },
};

const ownerKey = (owner: Owner) =>
  owner.kind === 'session' ? `session:${owner.session.id}` : `network:${owner.network}`;

export type Admission = ReturnType<typeof createAdmission>;

// Cuántos canales tiene abiertos cada dueño; el que no entra recibe cuánto esperar.
export function createAdmission(limiter: RateLimiter) {
  const { channels: caps } = realtimeSettings;
  const byOwner = new Map<string, number>();
  let total = 0;
  let anonymous = 0;

  const full = (owner: Owner): boolean => {
    const mine = byOwner.get(ownerKey(owner)) ?? 0;
    if (owner.kind === 'session') return mine >= caps.perSession || total >= caps.total;
    return mine >= caps.perAnonymousNetwork || anonymous >= caps.anonymousTotal;
  };

  return {
    // Si puede abrir otro canal ahora; si no, en cuántos milisegundos probar de nuevo.
    admit(owner: Owner): { allowed: true } | { allowed: false; retryAfterMs: number } {
      const hit = limiter.hit(`realtime:open:${ownerKey(owner)}`, realtimeSettings.opens);
      if (!hit.allowed) return { allowed: false, retryAfterMs: hit.retryAfterMs };
      if (full(owner)) return { allowed: false, retryAfterMs: realtimeSettings.beatEveryMs };
      return { allowed: true };
    },
    opened(channel: Channel): void {
      const key = ownerKey(channel.owner);
      byOwner.set(key, (byOwner.get(key) ?? 0) + 1);
      total += 1;
      if (channel.owner.kind === 'anonymous') anonymous += 1;
    },
    closed(channel: Channel): void {
      const key = ownerKey(channel.owner);
      const left = (byOwner.get(key) ?? 1) - 1;
      if (left === 0) byOwner.delete(key);
      else byOwner.set(key, left);
      total -= 1;
      if (channel.owner.kind === 'anonymous') anonymous -= 1;
    },
    // Si ese canal puede cambiar sus suscripciones otra vez en esta ventana.
    mayChange: (channel: Channel) =>
      limiter.hit(`realtime:changes:${channel.id}`, realtimeSettings.subscriptionChanges).allowed,
  };
}
