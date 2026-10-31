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

// Cuándo confirmó por última vez quién es en esta sesión, con Google o la huella (02 · R3.8): la más
// nueva de las dos, o ninguna (la computadora que entró con el celular).
export function confirmedAtOf(session: { googleAt: Date | null; passkeyAt: Date | null }) {
  const times = [session.googleAt, session.passkeyAt].filter((at): at is Date => at !== null);
  return times.length > 0 ? new Date(Math.max(...times.map(Number))) : null;
}
