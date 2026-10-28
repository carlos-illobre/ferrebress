// Cuenta pedidos por clave en ventanas fijas, en memoria (diseño de 01, § 8). Con varias copias
// del servidor pasa a PostgreSQL sin tocar a quien lo usa (ADR-015).
import type { Clock } from './clock.ts';

export type Window = { max: number; windowMs: number };

export type Hit = {
  allowed: boolean;
  retryAfterMs: number;
  // Solo en el primer pedido de una ventana nueva: cuántos hubo en la ventana anterior.
  previousCount?: number;
};

// Con muchas claves se barren las vencidas, pero como mucho una vez por minuto: barrer en cada
// clave nueva dejaba que claves inventadas frenaran el servidor (revisión de seguridad, punto 27).
const sweepAbove = 10_000;
const sweepEveryMs = 60_000;

export function createRateLimiter(clock: Clock) {
  const windows = new Map<string, { start: number; count: number; windowMs: number }>();
  let sweptAt = Number.NEGATIVE_INFINITY;

  const sweep = (now: number) => {
    if (windows.size < sweepAbove || now - sweptAt < sweepEveryMs) return;
    sweptAt = now;
    for (const [key, entry] of windows)
      if (now - entry.start >= entry.windowMs) windows.delete(key);
  };

  return {
    // Si la clave ya pasó el máximo en su ventana, sin contar este pedido.
    exceeded(key: string, { max, windowMs }: Window): boolean {
      const current = windows.get(key);
      return !!current && clock.now().getTime() - current.start < windowMs && current.count >= max;
    },

    hit(key: string, { max, windowMs }: Window): Hit {
      const now = clock.now().getTime();
      const current = windows.get(key);
      if (current && now - current.start < windowMs) {
        current.count += 1;
        const allowed = current.count <= max;
        return { allowed, retryAfterMs: allowed ? 0 : current.start + windowMs - now };
      }
      sweep(now);
      windows.set(key, { start: now, count: 1, windowMs });
      return {
        allowed: max >= 1,
        retryAfterMs: 0,
        ...(current && { previousCount: current.count }),
      };
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;
