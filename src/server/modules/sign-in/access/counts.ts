// Cuántas sesiones abiertas y celulares con huella tiene cada persona, para la lista de Usuarios
// (02 · R5.1): sin la sesión de quien pregunta ni sus propios celulares, que no se le muestran
// (R5.2, R5.5). Dos consultas para toda la lista, que siempre tiene al menos a quien pregunta.
import type { RequestSession } from '../../../platform/session.ts';
import type { SignInContext } from '../context.ts';
import { signInSettings } from '../settings.ts';
import { accessData } from './data.ts';

export async function countsOf(ctx: SignInContext, userIds: string[], asking: RequestSession) {
  const data = accessData(ctx.platform.db as never);
  const counts = new Map(userIds.map((id) => [id, { sessions: 0, phones: 0 }]));
  const now = ctx.platform.clock.now();
  const [sessions, phones] = await Promise.all([
    data.sessionCounts(userIds, asking.id, now, signInSettings.session),
    data.passkeyCounts(userIds, asking.userId),
  ]);
  for (const row of sessions) (counts.get(row.userId) as { sessions: number }).sessions = row.n;
  for (const row of phones) (counts.get(row.userId) as { phones: number }).phones = row.n;
  return counts;
}
