// Las rutas de Usuarios para las personas (diseño de 02, § 4): la lista y autorizar, cambiar,
// borrar, dar de baja y de alta. Todas con sesión; los cambios, con un límite por sesión, y
// autorizar y dar de alta, con Google o la huella de los últimos 5 minutos (R3.8). Cada cambio queda
// en la auditoría, y cada rechazo, una vez por minuto por motivo y persona (R6.1).
import {
  authorizeBody,
  changeBody,
  type PeopleResponse,
  type PersonResponse,
  type PersonRow,
  versionBody,
} from '@ferrebress/shared/contracts/users';
import type { Context, MiddlewareHandler } from 'hono';
import { bySchema, createGuards, readBody } from '../../platform/guards.ts';
import { fail } from '../../platform/http.ts';
import type { Platform } from '../../platform/modules.ts';
import { sessionOf } from '../../platform/session.ts';
import type { Outcome, People } from './people.ts';
import { displayName, neverSignedIn, type User } from './rules.ts';

const minute = 60_000;
export const usersSettings = {
  // Los cambios desde Usuarios, por sesión (02, § 9).
  changes: { max: 60, windowMs: minute },
  throttledAudit: { max: 1, windowMs: minute },
  // Autorizar y dar de alta, con Google o la huella de hace menos de esto (R3.8).
  confirmWithinMs: 5 * minute,
};

// Cuántas sesiones abiertas y celulares con huella tiene cada persona, sin lo que no se le muestra a
// quien pregunta (R5.2, R5.5). Lo da sign-in.
export type AccessCounts = (
  userIds: string[],
  asking: ReturnType<typeof sessionOf>,
) => Promise<Map<string, { sessions: number; phones: number }>>;

const time = (at: Date | null) => (at ? at.getTime() : null);

export function rowOf(
  user: User,
  askingUserId: string,
  counts = { sessions: 0, phones: 0 },
): PersonRow {
  return {
    id: user.id,
    name: user.name,
    displayName: displayName(user),
    email: user.email,
    active: user.active,
    self: user.id === askingUserId,
    authorizedAt: user.createdAt.getTime(),
    authorizedBy: user.authorizedBy,
    deactivatedAt: time(user.deactivatedAt),
    lastSignInAt: time(user.lastSignInAt),
    neverSignedIn: neverSignedIn(user),
    version: user.version,
    ...counts,
  };
}

const statusOf = { 'not-found': 404, 'email-taken': 409 } as const;

type Route = {
  platform: Platform;
  people: People;
  guards: ReturnType<typeof createGuards>;
  limited: MiddlewareHandler;
};

export function registerPeopleRoutes(
  platform: Platform,
  people: People,
  findAll: () => Promise<User[]>,
  accessCounts: AccessCounts,
) {
  const guards = createGuards(platform, {
    event: 'users.throttled',
    window: usersSettings.throttledAudit,
  });
  const limited = guards.limit((c) => [`users:session:${sessionOf(c).id}`], usersSettings.changes);
  const route = { platform, people, guards, limited };
  platform.http.get('/api/users', platform.sessions.require, async (c) => {
    const asking = sessionOf(c);
    const all = await findAll();
    const counts = await accessCounts(
      all.map((user) => user.id),
      asking,
    );
    return c.json<PeopleResponse>({
      people: all.map((user) => rowOf(user, asking.userId, counts.get(user.id))),
    });
  });
  registerChanges(route);
  registerStatus(route);
}

// La respuesta de un cambio: la persona como quedó, o el rechazo, anotado una vez por minuto por
// motivo y persona.
function answer({ platform, guards }: Route, c: Context, outcome: Outcome, type: string) {
  const asking = sessionOf(c).userId;
  if (!('refused' in outcome)) {
    guards.record(c, type, { userId: asking, data: { targetUserId: outcome.user.id } });
    return c.json<PersonResponse>({ person: rowOf(outcome.user, asking) });
  }
  const target = c.req.param('id') ?? 'new';
  const key = `audit:users:${outcome.refused}:${target}`;
  if (platform.limiter.hit(key, usersSettings.throttledAudit).allowed)
    guards.record(c, 'users.rejected', {
      userId: asking,
      data: { targetUserId: target, reason: outcome.refused },
    });
  const status =
    outcome.refused in statusOf ? statusOf[outcome.refused as keyof typeof statusOf] : 409;
  const person = outcome.user ? { person: rowOf(outcome.user, asking) } : {};
  return fail(c, status, outcome.refused, person);
}

// R3.8: con Google o la huella de los últimos minutos.
function confirmed(platform: Platform, c: Context) {
  const at = sessionOf(c).confirmedAt;
  return !!at && platform.clock.now().getTime() - at.getTime() < usersSettings.confirmWithinMs;
}

// Autorizar, cambiar el nombre o el correo, y borrar.
function registerChanges(route: Route) {
  const { platform, people, guards, limited } = route;
  const { http, sessions } = platform;
  const authorizing = readBody(bySchema(authorizeBody));
  http.post('/api/users', sessions.require, limited, authorizing.step, async (c) => {
    if (!confirmed(platform, c)) return fail(c, 403, 'confirm-first');
    const { email, name } = authorizing.of(c);
    const outcome = await people.authorize(sessionOf(c).userId, email, name);
    return answer(route, c, outcome, 'user.authorized');
  });
  const changing = readBody(bySchema(changeBody));
  http.post('/api/users/:id', sessions.require, limited, changing.step, async (c) => {
    const { version, name, email } = changing.of(c);
    const outcome = await people.change(c.req.param('id'), version, {
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
    });
    return answer(route, c, outcome, email === undefined ? 'user.renamed' : 'user.email-changed');
  });
  const versioned = readBody(bySchema(versionBody));
  http.post('/api/users/:id/delete', sessions.require, limited, versioned.step, async (c) => {
    const id = c.req.param('id');
    const removed = await people.remove(id, versioned.of(c).version);
    if (!('removed' in removed)) return answer(route, c, removed, 'user.deleted');
    guards.record(c, 'user.deleted', { userId: sessionOf(c).userId, data: { targetUserId: id } });
    return c.json({ removed: true });
  });
}

// Dar de baja y de alta.
function registerStatus(route: Route) {
  const { platform, people, limited } = route;
  const { http, sessions } = platform;
  const versioned = readBody(bySchema(versionBody));
  http.post('/api/users/:id/deactivate', sessions.require, limited, versioned.step, async (c) => {
    const asking = sessionOf(c).userId;
    const outcome = await people.deactivate(asking, c.req.param('id'), versioned.of(c).version);
    return answer(route, c, outcome, 'user.deactivated');
  });
  http.post('/api/users/:id/activate', sessions.require, limited, versioned.step, async (c) => {
    if (!confirmed(platform, c)) return fail(c, 403, 'confirm-first');
    const asking = sessionOf(c).userId;
    const outcome = await people.activate(asking, c.req.param('id'), versioned.of(c).version);
    return answer(route, c, outcome, 'user.activated');
  });
}
