// Las reglas de entrar sin conexión (15 · R1 a R3; diseño de 15, § 4), sin tecnología: quién
// puede y si una confirmación llega a tiempo. El plazo se mide solo con lo que sabe el servidor:
// las horas que manda el celular se guardan, pero no deciden nada, salvo la de los 30 días.
import type { ClosedReason } from '../sessions/rules.ts';

const minute = 60_000;
const hour = 60 * minute;

export const offlineSettings = {
  // Cuánto se puede entrar sin conexión desde el último contacto con sesión (15 · R2.2).
  windowMs: 24 * hour,
  // El último uso de las sesiones se escribe por tandas: un poco de margen.
  marginMs: 5 * minute,
  // Una entrada sin conexión se guarda 30 días; una firma más vieja no se acepta.
  retentionMs: 30 * 24 * hour,
};

export type OfflineReason =
  | 'deactivated'
  | 'not-allowed'
  | 'revoked-session'
  | 'too-late'
  | 'too-old';

// Hasta el módulo 02, todas las personas activas son Administrador, que tiene el permiso.
export const canWorkOffline = (user: { active: boolean }): boolean => user.active;

export type Judged = {
  user: { active: boolean };
  // `canWorkOffline` de la persona.
  allowed: boolean;
  // La sesión más nueva de ese celular, y su último uso: el último contacto con sesión.
  lastSession: { lastUsedAt: Date; closedReason: ClosedReason | null } | undefined;
  now: Date;
  // Las horas del celular, que solo sirven para saber cuánto tiempo pasó según él.
  signedAt: Date;
  lastContactAt: Date;
};

// Por qué no se confirma, o undefined si se confirma.
export function rejectionOf(judged: Judged): OfflineReason | undefined {
  const { user, allowed, lastSession, now, signedAt, lastContactAt } = judged;
  if (!user.active) return 'deactivated';
  if (!allowed) return 'not-allowed';
  if (!lastSession) return 'too-late';
  if (lastSession.closedReason === 'revoked') return 'revoked-session';
  const since = now.getTime() - lastSession.lastUsedAt.getTime();
  if (since > offlineSettings.windowMs + offlineSettings.marginMs) return 'too-late';
  const age = signedAt.getTime() - lastContactAt.getTime();
  return age > offlineSettings.retentionMs ? 'too-old' : undefined;
}
