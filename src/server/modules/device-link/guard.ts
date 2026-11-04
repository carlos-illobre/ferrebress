// Lo que el vínculo suma a todos los pedidos (diseño de 03, § 3.5 y § 7.2): el campo `l=` de la
// cabecera, la huella del vínculo de quien pregunta, para que la aplicación se entere sin canal de que
// lo terminaron, lo pausaron o el otro volvió; y el paso de las escrituras hechas mientras se espeja,
// que llevan `X-Pairing`: con un vínculo que ya terminó, o con el otro lado sin sesión, no pasan.
import { createHash } from 'node:crypto';
import { pairingHeaderName } from '@ferrebress/shared/contracts/device-link';
import type { Context } from 'hono';
import { fail } from '../../platform/http.ts';
import type { RequestSession } from '../../platform/session.ts';
import type { DeviceLinkContext } from './context.ts';
import { keyOf, pairingTopic } from './lifecycle.ts';
import { otherSide, type Pairing, sideOf } from './rules.ts';

export const pairingHeader = pairingHeaderName;

// La huella: cambia si cambia el vínculo, la pausa o si el otro lado escucha.
function fingerprintOf(ctx: DeviceLinkContext, pairing: Pairing, session: RequestSession): string {
  const other = keyOf(pairing.id, otherSide(sideOf(session)));
  const listening = ctx.platform.realtime.listeners(pairingTopic, other) > 0;
  const state = `${pairing.id}|${pairing.pausedAt !== null}|${listening}`;
  return createHash('sha256').update(state).digest('hex').slice(0, 8);
}

// Si la escritura hecha con ese vínculo todavía vale: el vínculo es el de la sesión y el otro lado
// sigue con su sesión abierta.
async function stillPaired(ctx: DeviceLinkContext, session: RequestSession, pairingId: string) {
  const pairing = await ctx.members.pairingOf(session.userId, session.deviceId);
  if (pairing?.id !== pairingId) return false;
  const other = ctx.members.sessionOf(pairing.id, otherSide(sideOf(session)));
  return other === undefined || ctx.platform.sessions.isOpen(other);
}

export function guardRequests(ctx: DeviceLinkContext): void {
  const { checks, header, sessions } = ctx.platform;
  header.contribute('l', (c: Context) => {
    const session = c.get('session') as RequestSession | undefined;
    const pairing = session && ctx.members.knownPairingOf(session.userId, session.deviceId);
    return pairing && session ? fingerprintOf(ctx, pairing, session) : undefined;
  });
  checks.add(async (c) => {
    const pairingId = c.req.header(pairingHeader);
    if (!pairingId || c.req.method === 'GET') return undefined;
    const session = await sessions.identify(c);
    if (session && (await stillPaired(ctx, session, pairingId))) return undefined;
    ctx.recordOnce(c, `pairing-ended:${session?.id ?? 'none'}`, 'device-link.rejected', {
      data: { reason: 'pairing-ended' },
    });
    return fail(c, 409, 'pairing-ended');
  });
}
