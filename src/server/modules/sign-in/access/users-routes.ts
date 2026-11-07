// Lo que Usuarios ve y corta de las sesiones y las huellas de cada persona (02 · R5; diseño de 02,
// § 4): la tarjeta, «Cerrar», «Cerrar todas», «Quitar» y «Se perdió un celular», que es la misma
// operación que «Quitar». Todo con sesión, con el permiso, con los identificadores de la dirección en
// forma de UUID y con el límite de cambios por sesión. La lógica es la de lo mío (cutting.ts).
import {
  type AccessResponse,
  cutBody,
  type LostPhonesResponse,
} from '@ferrebress/shared/contracts/users';
import type { Context, MiddlewareHandler } from 'hono';
import { bySchema, readBody } from '../../../platform/guards.ts';
import { uuidParams } from '../../../platform/http.ts';
import { sessionOf } from '../../../platform/session.ts';
import type { SignInContext } from '../context.ts';
import { signInSettings } from '../settings.ts';
import { closeSessions, cutPhone, refuse } from './cutting.ts';
import { accessData } from './data.ts';
import { accessCard } from './listing.ts';
import { lostPhones } from './lost.ts';

const person = (c: Context) => c.req.param('id') as string;

export function registerUsersAccessRoutes(ctx: SignInContext) {
  const { http, sessions, permissions } = ctx.platform;
  const data = accessData(ctx.platform.db as never);
  const limited = ctx.limit(
    (c) => [`users:session:${sessionOf(c).id}`],
    signInSettings.limits.accessChanges,
  );
  const cuts = permissions.require('users.cut');
  // Cortar: «Cortar sesiones y huellas», y no a quien tiene más (R7.11).
  const notOutranked: MiddlewareHandler = async (c, next) =>
    (await ctx.users.outranks(sessionOf(c).userId, person(c)))
      ? refuse(ctx, c, person(c), 403, 'outranked')
      : await next();

  const ids = (...names: string[]) => uuidParams('id', ...names);
  registerCutting(ctx, { ids, steps: [sessions.require, cuts], notOutranked, limited });
  http.get('/api/lost-phones', sessions.require, cuts, async (c) =>
    c.json<LostPhonesResponse>(await lostPhones(ctx, data, sessionOf(c), ctx.platform.clock.now())),
  );
  http.get(
    '/api/users/:id/access',
    sessions.require,
    permissions.require('users.view'),
    ids(),
    async (c) => c.json<AccessResponse>(await accessCard(ctx, person(c), sessionOf(c))),
  );
}

type Steps = {
  ids: (...names: string[]) => MiddlewareHandler;
  steps: readonly [MiddlewareHandler, MiddlewareHandler];
  notOutranked: MiddlewareHandler;
  limited: MiddlewareHandler;
};

// «Cerrar», «Cerrar todas», «Quitar» y «Cortar».
function registerCutting(ctx: SignInContext, { ids, steps, notOutranked, limited }: Steps) {
  const { http } = ctx.platform;
  http.post(
    '/api/users/:id/sessions/:sessionId/close',
    ...steps,
    ids('sessionId'),
    notOutranked,
    limited,
    (c) => closeSessions(ctx, c, person(c), c.req.param('sessionId') as string, 'users'),
  );
  http.post('/api/users/:id/sessions/close', ...steps, ids(), notOutranked, limited, (c) =>
    closeSessions(ctx, c, person(c), null, 'users'),
  );
  const cutting = readBody(bySchema(cutBody));
  http.post(
    '/api/users/:id/phones/:phoneId/cut',
    ...steps,
    ids('phoneId'),
    notOutranked,
    limited,
    cutting.step,
    (c) =>
      cutPhone(ctx, c, {
        userId: person(c),
        key: c.req.param('phoneId') as string,
        how: cutting.of(c).from === 'lost' ? 'lost' : 'remove',
        place: 'users',
      }),
  );
}
