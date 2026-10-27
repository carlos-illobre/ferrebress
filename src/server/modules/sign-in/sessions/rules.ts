// Cuándo una sesión sigue valiendo (ADR-015, R3): sin tecnología, se prueba con fechas fijas.
export type SessionLimits = { idleMs: number; maxMs: number };

export type ClosedReason = 'sign-out' | 'revoked' | 'deactivated' | 'idle' | 'max-age';

export type SessionTimes = { createdAt: Date; lastUsedAt: Date; closedReason: ClosedReason | null };

// Por qué está cerrada, o null si sigue valiendo. El tope de 8 horas pesa más que la falta de uso.
export function closedReasonOf(
  session: SessionTimes,
  now: Date,
  limits: SessionLimits,
): ClosedReason | null {
  if (session.closedReason) return session.closedReason;
  if (now.getTime() - session.createdAt.getTime() >= limits.maxMs) return 'max-age';
  if (now.getTime() - session.lastUsedAt.getTime() >= limits.idleMs) return 'idle';
  return null;
}
