// Las rutas de Usuarios para las personas (diseño de 02, § 4): la lista y autorizar, cambiar,
// borrar, dar de baja y de alta. Todas con sesión; los cambios, con un límite por sesión, y
// autorizar, cambiar el correo y dar de alta, con Google o la huella de los últimos 5 minutos (R3.8). Cada cambio queda
// en la auditoría, y cada rechazo, una vez por minuto por motivo y persona (R6.1).

import {
  authorizeBody,
  changeBody,
  type PeopleResponse,
  type PersonResponse,
  versionBody,
} from '@ferrebress/shared/contracts/users';
import type { Context, MiddlewareHandler } from 'hono';
import { bySchema, type Guards, readBody } from '../../platform/guards.ts';
import { fail, uuidParams } from '../../platform/http.ts';
import type { Platform } from '../../platform/modules.ts';
import { sessionOf } from '../../platform/session.ts';
import { personRecord } from './audit.ts';
import { confirmed, type Rejection, statusOf, usersGuards } from './guards.ts';
import type { Outcome, People } from './people.ts';
import type { Access } from './roles/access.ts';
import { rowOf } from './row.ts';
import type { User } from './rules.ts';

// Cuántas sesiones abiertas y celulares con huella tiene cada persona, sin lo que no se le muestra a
// quien pregunta (R5.2, R5.5). Lo da sign-in.
export type AccessCounts = (
  userIds: string[],
  asking: ReturnType<typeof sessionOf>,
) => Promise<Map<string, { sessions: number; phones: number }>>;

type Route = {
  platform: Platform;
  people: People;
  access: Access;
  guards: Guards;
  limited: MiddlewareHandler;
};

// Un rechazo, anotado una vez por minuto por motivo y por quien lo pide (R6.1, seguridad 34).
function rejected(
  { guards }: Route,
  c: Context,
  code: Rejection,
  extra: Record<string, unknown> = {},
) {
  const target = c.req.param('id');
  guards.recordOnce(c, `users:${code}:${sessionOf(c).userId}`, 'users.rejected', {
    ...(target && { targets: [{ kind: 'person', id: target }] }),
    data: { reason: code },
  });
  return fail(c, statusOf[code], code, extra);
}

// R7.11: sobre una persona con algún permiso que quien lo pide no tiene, no.
const notOutranked =
  (route: Route): MiddlewareHandler =>
  async (c, next) =>
    (await route.access.outranks(sessionOf(c).userId, c.req.param('id') as string))
      ? rejected(route, c, 'outranked')
      : await next();

export function registerPeopleRoutes(
  platform: Platform,
  people: People,
  findAll: () => Promise<User[]>,
  accessCounts: AccessCounts,
  access: Access,
) {
  const { guards, limited } = usersGuards(platform);
  const route = { platform, people, access, guards, limited };
  const view = platform.permissions.require('users.view');
  platform.http.get('/api/users', platform.sessions.require, view, async (c) => {
    const asking = sessionOf(c);
    const all = await findAll();
    const ids = all.map((user) => user.id);
    const [counts, above, roles] = await Promise.all([
      accessCounts(ids, asking),
      access.outranking(asking.userId, ids),
      access.rolesForList(),
    ]);
    return c.json<PeopleResponse>({
      people: all.map((user) =>
        rowOf(user, asking.userId, counts.get(user.id), above.has(user.id)),
      ),
      roles,
    });
  });
  registerChanges(route);
  registerStatus(route);
}

// La respuesta de un cambio: la persona como quedó, o el rechazo, anotado.
function answer(route: Route, c: Context, outcome: Outcome, type: string) {
  const { guards } = route;
  const asking = sessionOf(c).userId;
  if (!('refused' in outcome)) {
    if (!outcome.unchanged) guards.record(c, type, personRecord(outcome.user, outcome.audit));
    return c.json<PersonResponse>({ person: rowOf(outcome.user, asking) });
  }
  const person = outcome.user ? { person: rowOf(outcome.user, asking) } : {};
  return rejected(route, c, outcome.refused, person);
}

// El correo, como autorizar, pide confirmar (R3.8) y no se le cambia a quien tiene más (R7.11).
async function emailRefused(platform: Platform, access: Access, c: Context) {
  if (!confirmed(platform, c)) return 'confirm-first';
  if (await access.outranks(sessionOf(c).userId, c.req.param('id') as string)) return 'outranked';
  return undefined;
}

// Autorizar y cambiar el nombre o el correo.
function registerChanges(route: Route) {
  const { platform, people, limited, access } = route;
  const { http, sessions, permissions } = platform;
  const [manage, id] = [permissions.require('users.manage'), uuidParams('id')];
  const authorizing = readBody(bySchema(authorizeBody));
  // Autorizar da roles: pide también «Administrar roles» (R3.3).
  const authorize = [manage, permissions.require('roles.manage')];
  http.post('/api/users', sessions.require, ...authorize, limited, authorizing.step, async (c) => {
    if (!confirmed(platform, c)) return rejected(route, c, 'confirm-first');
    const { email, name, roles } = authorizing.of(c);
    if (roles.length === 0) return rejected(route, c, 'no-roles');
    const outcome = await people.authorize(sessionOf(c).userId, email, name, roles);
    return answer(route, c, outcome, 'user.authorized');
  });
  const changing = readBody(bySchema(changeBody));
  http.post('/api/users/:id', sessions.require, manage, id, limited, changing.step, async (c) => {
    const { version, name, email } = changing.of(c);
    // Sin nada que cambiar no es un pedido.
    if (name === undefined && email === undefined) return fail(c, 400, 'bad-request');
    const refused = email !== undefined && (await emailRefused(platform, access, c));
    if (refused) return rejected(route, c, refused);
    const outcome = await people.change(c.req.param('id'), version, {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
    });
    return answer(route, c, outcome, email === undefined ? 'user.renamed' : 'user.email-changed');
  });
  registerRemove(route);
}

// Borrar el alta, solo si nunca entró (R3.7).
function registerRemove(route: Route) {
  const { platform, people, guards, limited } = route;
  const { http, sessions, permissions } = platform;
  const [manage, id] = [permissions.require('users.manage'), uuidParams('id')];
  const versioned = readBody(bySchema(versionBody));
  // Borrar el alta: tampoco sobre quien tiene más (R7.11).
  http.post(
    '/api/users/:id/delete',
    sessions.require,
    manage,
    id,
    notOutranked(route),
    limited,
    versioned.step,
    async (c) => {
      const target = c.req.param('id');
      const removed = await people.remove(target, versioned.of(c).version);
      if (!('removed' in removed)) return answer(route, c, removed, 'user.deleted');
      guards.record(c, 'user.deleted', personRecord({ ...removed.removed, roleIds: [] }, {}, true));
      return c.json({ removed: true });
    },
  );
}

// Dar de baja y de alta.
function registerStatus(route: Route) {
  const { platform, people, limited } = route;
  const { http, sessions } = platform;
  const versioned = readBody(bySchema(versionBody));
  const id = uuidParams('id');
  // Dar de baja y de alta: «Administrar personas», y no sobre quien tiene más (R7.11).
  const status = [platform.permissions.require('users.manage'), id, notOutranked(route), limited];
  http.post('/api/users/:id/deactivate', sessions.require, ...status, versioned.step, async (c) => {
    const asking = sessionOf(c).userId;
    const outcome = await people.deactivate(asking, c.req.param('id'), versioned.of(c).version);
    return answer(route, c, outcome, 'user.deactivated');
  });
  http.post('/api/users/:id/activate', sessions.require, ...status, versioned.step, async (c) => {
    if (!confirmed(platform, c)) return rejected(route, c, 'confirm-first');
    const asking = sessionOf(c).userId;
    const outcome = await people.activate(asking, c.req.param('id'), versioned.of(c).version);
    return answer(route, c, outcome, 'user.activated');
  });
}
