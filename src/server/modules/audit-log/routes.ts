// Las rutas de Quién hizo qué (diseño de 05, § 5): la lista, cuántas nuevas, las personas de los
// filtros y el día de la cinta. Las cuatro piden sesión y «Ver quién hizo qué», con un límite por
// persona (lo que la pantalla pide sola, X-Auto, tiene el suyo por sesión); leen en el hilo de la
// auditoría y no anotan nada, salvo que se abrió, una vez por sesión y por día y solo si lo pidió la
// persona (R1.3).
import {
  type AuditDay,
  type AuditNewOnes,
  type AuditPage,
  type AuditPeople,
  auditQuery,
  dayQuery,
  newOnesQuery,
} from '@ferrebress/shared/contracts/audit-log';
import { automaticHeaderName } from '@ferrebress/shared/contracts/server-header';
import { businessDateOf } from '@ferrebress/shared/time/business';
import type { Context, MiddlewareHandler } from 'hono';
import { createGuards } from '../../platform/guards.ts';
import { fail } from '../../platform/http.ts';
import type { Platform } from '../../platform/modules.ts';
import { sessionOf } from '../../platform/session.ts';
import type { AuditReader } from '../../platform/storage/audit/reader.ts';
import { type Ask, asking, dayOf, pageOf } from './answers.ts';
import { filterOf, firstDate, periodOf, sinceOf } from './rules.ts';
import { auditLogSettings } from './settings.ts';

export function registerAuditLogRoutes(platform: Platform, reader: AuditReader) {
  const { http, sessions, permissions, clock } = platform;
  const guards = createGuards(platform, {
    topic: 'audit-log',
    window: auditLogSettings.throttledAudit,
  });
  const routes: Routes = {
    ask: asking(reader),
    // Sesión, el permiso y el límite: el de la persona, o el de la sesión para lo que se pide solo.
    path: (path, handler) =>
      http.get(path, sessions.require, permissions.require('audit-log.view'), limited, handler),
    today: () => businessDateOf(clock.now()),
    year: () => clock.now().getUTCFullYear(),
    opened: openedOnce(guards),
  };
  const byPerson = guards.limit(
    (c) => [`audit-log:person:${sessionOf(c).userId}`],
    auditLogSettings.reads,
  );
  const bySession = guards.limit(
    (c) => [`audit-log:auto:${sessionOf(c).id}`],
    auditLogSettings.autoReads,
  );
  const limited: MiddlewareHandler = (c, next) =>
    isAuto(c) ? bySession(c, next) : byPerson(c, next);
  registerList(routes);
  registerNewOnes(routes);
  registerPeopleAndDay(routes);
}

type Routes = {
  ask: Ask;
  path: (path: string, handler: (c: Context) => Promise<Response>) => void;
  today: () => string;
  year: () => number;
  opened: (c: Context, day: string) => void;
};

function registerList({ ask, path, today, opened }: Routes) {
  path('/api/audit-log', async (c) => {
    const query = auditQuery.safeParse(c.req.query());
    if (!query.success) return fail(c, 400, 'bad-request', { field: fieldOf(query.error) });
    const day = today();
    opened(c, day);
    const answer = await pageOf(ask, query.data, day);
    return typeof answer === 'string'
      ? fail(c, 400, 'bad-request', { field: answer })
      : c.json<AuditPage>(answer);
  });
}

// Cuántas llegaron desde `since` con los filtros de la lista: el «3 nuevas» (R4.6, E51).
function registerNewOnes({ ask, path, today, year, opened }: Routes) {
  path('/api/audit-log/new', async (c) => {
    const query = newOnesQuery.safeParse(c.req.query());
    if (!query.success) return fail(c, 400, 'bad-request', { field: fieldOf(query.error) });
    const since = sinceOf(query.data.since, year());
    if (!since) return fail(c, 400, 'bad-request', { field: 'since' });
    const day = today();
    opened(c, day);
    const period = periodOf(query.data, day);
    const filter = typeof period === 'string' ? period : filterOf(query.data, period);
    if (typeof filter === 'string') return fail(c, 400, 'bad-request', { field: filter });
    return c.json<AuditNewOnes>({ count: await ask.newer(filter, since) });
  });
}

function registerPeopleAndDay({ ask, path, today, opened }: Routes) {
  path('/api/audit-log/people', async (c) => {
    opened(c, today());
    return c.json<AuditPeople>({
      people: (await ask.people()).map(({ userId, name, email, state }) => ({
        id: userId,
        name,
        state,
        ...(email && { email }),
      })),
    });
  });

  path('/api/audit-log/day', async (c) => {
    const query = dayQuery.safeParse(c.req.query());
    const day = today();
    const date = query.success ? (query.data.date ?? day) : undefined;
    if (!date || date > day || date < firstDate)
      return fail(c, 400, 'bad-request', { field: 'date' });
    opened(c, day);
    return c.json<AuditDay>(await dayOf(ask, date, day));
  });
}

// Lo que la pantalla pide sola, sin que nadie la toque (diseño de 05, § 7.1).
const isAuto = (c: Context) => c.req.header(automaticHeaderName) === '1';

// R1.3: abrir Quién hizo qué queda una vez por sesión y por día, con cualquiera de sus rutas y solo si
// lo pidió la persona (en memoria: si el servidor se reinicia, puede quedar una vez más ese día).
function openedOnce(guards: ReturnType<typeof createGuards>) {
  const opened = new Set<string>();
  let current = '';
  return (c: Context, day: string) => {
    // Las marcas de otros días ya no sirven: se olvidan al cambiar el día.
    if (day !== current) opened.clear();
    current = day;
    if (isAuto(c)) return;
    const mark = sessionOf(c).id;
    if (opened.has(mark)) return;
    opened.add(mark);
    guards.record(c, 'audit-log.opened');
  };
}

const fieldOf = (error: { issues: { path: PropertyKey[]; keys?: string[] }[] }) => {
  const [issue] = error.issues as [{ path: PropertyKey[]; keys?: string[] }];
  return String(issue.keys?.[0] ?? issue.path[0]);
};
