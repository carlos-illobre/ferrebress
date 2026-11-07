// Lo que el vínculo suma a los pedidos (diseño de 03, § 3.5, § 7.2 y § 10.1): su parte de `/api/start`
// (el vínculo, para no pedirlo al abrir); el campo `l=` de la cabecera, la huella del vínculo de quien
// pregunta, para que la aplicación se entere sin canal de que lo terminaron, lo pausaron o el otro
// volvió; y el paso de las escrituras hechas mientras se espeja, que llevan `X-Pairing`: con un vínculo
// que ya terminó, o con el otro lado sin sesión, no pasan.
import { createHash } from 'node:crypto';
import { pairingHeaderName } from '@ferrebress/shared/contracts/device-link';
import { isMirroredWrite } from '@ferrebress/shared/contracts/pairing';
import type { Context } from 'hono';
import { fail } from '../../platform/http.ts';
import type { RequestSession } from '../../platform/session.ts';
import type { DeviceLinkContext } from './context.ts';
import { keyOf, pairingTopic } from './lifecycle.ts';
import { otherSide, type Pairing, sideOf, viewOf } from './rules.ts';

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
  const { checks, header, sessions, start } = ctx.platform;
  // Al abrir, el vínculo de esta sesión, o `null` si no hay (§ 10.1): sin un pedido más.
  start.contribute('pairing', async (c) => {
    // `/api/start` pide las partes solo con sesión.
    const session = (await sessions.identify(c)) as RequestSession;
    const pairing = await ctx.members.pairingOf(session.userId, session.deviceId);
    return pairing ? viewOf(pairing, sideOf(session), ctx.names) : null;
  });
  header.contribute('l', (c: Context) => {
    const session = c.get('session') as RequestSession | undefined;
    const pairing = session && ctx.members.knownPairingOf(session.userId, session.deviceId);
    return pairing && session ? fingerprintOf(ctx, pairing, session) : undefined;
  });
  checks.add(async (c) => {
    const pairingId = c.req.header(pairingHeader);
    if (!pairingId || c.req.method === 'GET' || !isMirroredWrite(c.req.path)) return undefined;
    const session = await sessions.identify(c);
    if (session && (await stillPaired(ctx, session, pairingId))) return undefined;
    ctx.recordOnce(c, `pairing-ended:${session?.id ?? 'none'}`, 'device-link.rejected', {
      data: { reason: 'pairing-ended' },
    });
    return fail(c, 409, 'pairing-ended');
  });
}
