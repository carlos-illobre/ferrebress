// Cuántas sesiones abiertas y celulares con huella tiene cada persona, para la lista de Usuarios
// (02 · R5.1): sin la sesión de quien pregunta, que no se le muestra (R5.2); sus celulares sí
// (R5.5). Dos consultas para toda la lista, que siempre tiene al menos a quien pregunta.
import type { RequestSession } from '../../../platform/session.ts';
import type { SignInContext } from '../context.ts';
import { accessData } from './data.ts';

export async function countsOf(ctx: SignInContext, userIds: string[], asking: RequestSession) {
  const data = accessData(ctx.platform.db as never);
  const counts = new Map(userIds.map((id) => [id, { sessions: 0, phones: 0 }]));
  const now = ctx.platform.clock.now();
  const [sessions, phones] = await Promise.all([
    data.sessionCounts(userIds, asking.id, now, ctx.limits()),
    data.passkeyCounts(userIds),
  ]);
  for (const row of sessions) (counts.get(row.userId) as { sessions: number }).sessions = row.n;
  for (const row of phones) (counts.get(row.userId) as { phones: number }).phones = row.n;
  return counts;
}
