// Las rutas de Quién hizo qué (diseño de 05, § 5): la lista, las personas de los filtros y el día de
// la cinta. Las tres piden sesión y «Ver quién hizo qué», con un límite por persona; leen en el hilo
// de la auditoría y no anotan nada, salvo que se abrió, una vez por sesión y por día (R1.3).
import {
  type AuditDay,
  type AuditPage,
  type AuditPeople,
  type AuditQuery,
  auditQuery,
  dayQuery,
} from '@ferrebress/shared/contracts/audit-log';
import { businessDateOf } from '@ferrebress/shared/time/business';
import type { Context } from 'hono';
import { createGuards } from '../../platform/guards.ts';
import { fail } from '../../platform/http.ts';
import type { Platform } from '../../platform/modules.ts';
import { sessionOf } from '../../platform/session.ts';
import type { PersonUpdate } from '../../platform/storage/audit/event.ts';
import type { AuditReader } from '../../platform/storage/audit/reader.ts';
import {
  dayCount,
  dayLimit,
  daysOf,
  type Filter,
  filterOf,
  instantsOf,
  type Mark,
  type Period,
  periodOf,
  type Stored,
  stripOf,
  viewOf,
  weekEndingOn,
} from './rules.ts';

const minute = 60_000;
export const auditLogSettings = { reads: { max: 60, windowMs: minute } };

// Las preguntas a la auditoría, con su tipo.
function asking(reader: AuditReader) {
  return {
    count: async (filter: Filter) => (await reader.ask({ op: 'count', filter })) as number,
    rows: async (filter: Filter, offset: number, limit: number) =>
      (await reader.ask({ op: 'rows', filter, offset, limit })) as Stored[],
    position: async (filter: Filter, id: string) =>
      (await reader.ask({ op: 'position', filter, id })) as { position: number } | null,
    tones: async (filter: Filter) =>
      (await reader.ask({ op: 'tones', filter })) as Record<string, number>,
    marks: async (filter: Filter, limit: number) =>
      (await reader.ask({ op: 'marks', filter, limit })) as Mark[],
    people: async () => (await reader.ask({ op: 'people' })) as PersonUpdate[],
  };
}
type Ask = ReturnType<typeof asking>;

export function registerAuditLogRoutes(platform: Platform, reader: AuditReader) {
  const { http, sessions, permissions, clock } = platform;
  const ask = asking(reader);
  const guards = createGuards(platform, {
    topic: 'audit-log',
    window: { max: 1, windowMs: minute },
  });
  const view = permissions.require('audit-log.view');
  const limited = guards.limit(
    (c) => [`audit-log:person:${sessionOf(c).userId}`],
    auditLogSettings.reads,
  );
  const opened = new Set<string>();
  const today = () => businessDateOf(clock.now());

  http.get('/api/audit-log', sessions.require, view, limited, async (c) => {
    const query = auditQuery.safeParse(c.req.query());
    if (!query.success) return fail(c, 400, 'bad-request', { field: fieldOf(query.error) });
    const day = today();
    // R1.3: abrir Quién hizo qué queda una vez por sesión y por día.
    const mark = `${sessionOf(c).id}|${day}`;
    if (!opened.has(mark)) {
      opened.add(mark);
      guards.record(c, 'audit-log.opened');
    }
    const answer = await pageOf(ask, query.data, day);
    return typeof answer === 'string'
      ? fail(c, 400, 'bad-request', { field: answer })
      : c.json<AuditPage>(answer);
  });

  http.get('/api/audit-log/people', sessions.require, view, limited, async (c) =>
    c.json<AuditPeople>({
      people: (await ask.people()).map(({ userId, name, email, state }) => ({
        id: userId,
        name,
        state,
        ...(email && { email }),
      })),
    }),
  );

  http.get('/api/audit-log/day', sessions.require, view, limited, async (c) => {
    const query = dayQuery.safeParse(c.req.query());
    const day = today();
    const date = query.success ? (query.data.date ?? day) : undefined;
    if (!date || date > day) return fail(c, 400, 'bad-request', { field: 'date' });
    return c.json<AuditDay>(await dayOf(ask, date, day));
  });
}

const fieldOf = (error: { issues: { path: PropertyKey[]; keys?: string[] }[] }) => {
  const [issue] = error.issues as [{ path: PropertyKey[]; keys?: string[] }];
  return String(issue.keys?.[0] ?? issue.path[0]);
};

// Una página de la lista (R4.2 a R4.5, R4.9), o el campo que no sirve.
async function pageOf(ask: Ask, query: AuditQuery, today: string): Promise<AuditPage | string> {
  const period = periodOf(query, today);
  if (typeof period === 'string') return period;
  const filter = filterOf(query, period);
  if (typeof filter === 'string') return filter;
  const size = Number(query.size ?? 20);
  const total = await ask.count(filter);
  const pages = Math.max(1, Math.ceil(total / size));
  const found = query.around ? await ask.position(filter, query.around) : null;
  const page = found ? Math.floor(found.position / size) + 1 : Number(query.page ?? 1);
  if (page > pages) return 'page';
  const events = await ask.rows(filter, (page - 1) * size, size);
  const names = new Map((await ask.people()).map((person) => [person.userId, person.name]));
  const summaryPeriod = period ?? { from: today, until: today };
  return {
    today,
    total,
    page,
    pages,
    days: await daysWith(ask, filter, daysOf(events)),
    events: events.map((event) => viewOf(event, names)),
    ...(query.summary && { summary: await summaryOf(ask, summaryPeriod) }),
    ...(query.strip &&
      summaryPeriod.from === summaryPeriod.until && { strip: await stripFor(ask, summaryPeriod) }),
    ...(found && query.around && { selected: query.around }),
  };
}

// Cuántas acciones con los filtros tiene cada día de la página, para su cabecera.
async function daysWith(ask: Ask, filter: Filter, days: string[]) {
  const counts: Record<string, number> = {};
  for (const day of days) {
    const range = instantsOf({ from: day, until: day });
    counts[day] = await ask.count({
      ...filter,
      from: Math.max(range.from, filter.from ?? range.from),
      until: Math.min(range.until, filter.until ?? range.until),
    });
  }
  return counts;
}

async function summaryOf(ask: Ask, period: Period) {
  const { total, amber, red } = dayCount(period.from, await ask.tones(instantsOf(period)));
  return { total, amber, red };
}

async function stripFor(ask: Ask, period: Period) {
  const range = instantsOf(period);
  const marks = await ask.marks(range, dayLimit * 50);
  return stripOf(marks, range.from);
}

// El día de la cinta (R4.11): entero, sin filtros, con los siete días que terminan en él.
async function dayOf(ask: Ask, date: string, today: string): Promise<AuditDay> {
  const week = [];
  for (const one of weekEndingOn(date))
    week.push(dayCount(one, await ask.tones(instantsOf({ from: one, until: one }))));
  const range = instantsOf({ from: date, until: date });
  const total = await ask.count(range);
  if (total > dayLimit) return { date, today, week, tooMany: total };
  const names = new Map((await ask.people()).map((person) => [person.userId, person.name]));
  const events = (await ask.rows(range, 0, dayLimit)).toReversed();
  return { date, today, week, events: events.map((event) => viewOf(event, names)) };
}
