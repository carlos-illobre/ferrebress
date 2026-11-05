// Las reglas de entrar sin conexión (15 · R1 a R3; diseño de 15, § 4), sin tecnología: quién
// puede y si una confirmación llega a tiempo. El plazo se mide solo con lo que sabe el servidor:
// las horas que manda el celular se guardan, pero no deciden nada, salvo que una firma muy vieja
// (o del futuro) no se acepta: las entradas se guardan 30 días, y una más vieja ya no tendría su
// fila para impedir que se use dos veces.

import { can } from '@ferrebress/shared/contracts/can';
import type { ClosedReason } from '../sessions/rules.ts';
import { signInSettings } from '../settings.ts';

export type OfflineReason =
  | 'deactivated'
  | 'not-allowed'
  | 'revoked-session'
  | 'too-late'
  | 'too-old';

// Con el permiso «Trabajar sin conexión» (02 · R7.1, 15 · R1.2). Una persona dada de baja no tiene
// ningún permiso.
export const canWorkOffline = (person: { permissions: readonly string[] }): boolean =>
  can(person, 'offline.work');

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
  if (since > signInSettings.offline.windowMs + signInSettings.offline.marginMs) return 'too-late';
  const age = now.getTime() - signedAt.getTime();
  return age > signInSettings.offline.maxAgeMs || -age > signInSettings.offline.maxAheadMs
    ? 'too-old'
    : undefined;
}
