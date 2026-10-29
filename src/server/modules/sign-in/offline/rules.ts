// Las reglas de entrar sin conexión (15 · R1 a R3; diseño de 15, § 4), sin tecnología: quién
// puede y si una confirmación llega a tiempo. El plazo se mide solo con lo que sabe el servidor:
// las horas que manda el celular se guardan, pero no deciden nada, salvo que una firma muy vieja
// (o del futuro) no se acepta: las entradas se guardan 30 días, y una más vieja ya no tendría su
// fila para impedir que se use dos veces.
import { offlineWindowHours } from '@ferrebress/shared/contracts/offline-sign-in';
import type { ClosedReason } from '../sessions/rules.ts';

const minute = 60_000;
const hour = 60 * minute;

export const offlineSettings = {
  // Cuánto se puede entrar sin conexión desde el último contacto con sesión (15 · R2.2).
  windowMs: offlineWindowHours * hour,
  // El último uso de las sesiones se escribe por tandas: un poco de margen.
  marginMs: 5 * minute,
  // Una entrada sin conexión se guarda 30 días; una firma de más de 29 días, o de más de un día en
  // el futuro (un reloj mal puesto), no se acepta.
  retentionMs: 30 * 24 * hour,
  maxAgeMs: 29 * 24 * hour,
  maxAheadMs: 24 * hour,
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
  // La hora del celular cuando puso la huella.
  signedAt: Date;
};

// Por qué no se confirma, o undefined si se confirma.
export function rejectionOf(judged: Judged): OfflineReason | undefined {
  const { user, allowed, lastSession, now, signedAt } = judged;
  if (!user.active) return 'deactivated';
  if (!allowed) return 'not-allowed';
  if (!lastSession) return 'too-late';
  if (lastSession.closedReason === 'revoked') return 'revoked-session';
  const since = now.getTime() - lastSession.lastUsedAt.getTime();
  if (since > offlineSettings.windowMs + offlineSettings.marginMs) return 'too-late';
  const age = now.getTime() - signedAt.getTime();
  return age > offlineSettings.maxAgeMs || -age > offlineSettings.maxAheadMs
    ? 'too-old'
    : undefined;
}
