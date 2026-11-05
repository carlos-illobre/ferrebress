// Las respuestas de Quién hizo qué (diseño de 05, § 5): las preguntas al hilo de la auditoría y cómo
// se arma cada respuesta con ellas. Las rutas (routes.ts) validan y deciden qué se pide.
import type { AuditDay, AuditPage, AuditQuery } from '@ferrebress/shared/contracts/audit-log';
import type { PersonUpdate } from '../../platform/storage/audit/event.ts';
import type { Span } from '../../platform/storage/audit/query.ts';
import type { AuditReader } from '../../platform/storage/audit/reader.ts';
import {
  dayCount,
  daysOf,
  type Filter,
  filterOf,
  instantsOf,
  type Latest,
  latestText,
  type Mark,
  type Period,
  periodOf,
  type Stored,
  stripOf,
  viewOf,
  weekEndingOn,
  withToday,
} from './rules.ts';
import { auditLogSettings } from './settings.ts';

// Las preguntas a la auditoría, con su tipo.
export function asking(reader: AuditReader) {
  return {
    count: async (filter: Filter) => (await reader.ask({ op: 'count', filter })) as number,
    rows: async (filter: Filter, offset: number, limit: number) =>
      (await reader.ask({ op: 'rows', filter, offset, limit })) as Stored[],
    tones: async (filter: Filter) =>
      (await reader.ask({ op: 'tones', filter })) as Record<string, number>,
    spans: async (filter: Filter, spans: Span[]) =>
      (await reader.ask({ op: 'spans', filter, spans })) as Record<string, number>[],
    marks: async (filter: Filter, limit: number) =>
      (await reader.ask({ op: 'marks', filter, limit })) as Mark[],
    people: async () => (await reader.ask({ op: 'people' })) as PersonUpdate[],
    latest: async () => (await reader.ask({ op: 'latest' })) as Latest,
    newer: async (filter: Filter, since: Latest) =>
      (await reader.ask({
        op: 'newer',
        filter,
        since,
        limit: auditLogSettings.newOnesMax,
      })) as number,
  };
}
export type Ask = ReturnType<typeof asking>;

// Una página de la lista (R4.2 a R4.5, R4.9), o el campo que no sirve.
export async function pageOf(
  ask: Ask,
  query: AuditQuery,
  today: string,
): Promise<AuditPage | string> {
  const period = periodOf(query, today);
  if (typeof period === 'string') return period;
  const chosen = filterOf(query, period);
  if (typeof chosen === 'string') return chosen;
  // Todo el pedido lee la misma foto: lo escrito mientras tanto lo cuenta el próximo «n nuevas».
  const latest = await ask.latest();
  const filter = { ...chosen, upTo: latest };
  const size = Number(query.size ?? 20);
  const total = await ask.count(filter);
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Number(query.page ?? 1);
  if (page > pages) return 'page';
  const events = await ask.rows(filter, (page - 1) * size, size);
  const names = new Map((await ask.people()).map((person) => [person.userId, person.name]));
  const summaryPeriod = period ?? { from: today, until: today };
  return {
    today,
    latest: latestText(latest),
    withToday: withToday(period, today),
    total,
    page,
    pages,
    days: await daysWith(ask, filter, daysOf(events)),
    events: events.map((event) => viewOf(event, names)),
    ...(query.summary && { summary: await summaryOf(ask, summaryPeriod, latest) }),
    ...(query.strip &&
      summaryPeriod.from === summaryPeriod.until && {
        strip: await stripFor(ask, summaryPeriod, latest),
      }),
  };
}

// Cuántas acciones con los filtros tiene cada día de la página, para su cabecera: una sola pregunta.
async function daysWith(ask: Ask, filter: Filter, days: string[]) {
  const spans = days.map((day): Span => {
    const range = instantsOf({ from: day, until: day });
    return [
      Math.max(range.from, filter.from ?? range.from),
      Math.min(range.until, filter.until ?? range.until),
    ];
  });
  const found = await ask.spans(filter, spans);
  return Object.fromEntries(
    days.map((day, i) => [day, dayCount(day, found[i] as Record<string, number>).total]),
  );
}

async function summaryOf(ask: Ask, period: Period, upTo: Latest) {
  const { total, amber, red } = dayCount(
    period.from,
    await ask.tones({ ...instantsOf(period), upTo }),
  );
  return { total, amber, red };
}

async function stripFor(ask: Ask, period: Period, upTo: Latest) {
  const range = instantsOf(period);
  const marks = await ask.marks({ ...range, upTo }, auditLogSettings.dayLimit * 50);
  return stripOf(marks, range.from);
}

// El día de la cinta (R4.11): entero, sin filtros, con los siete días que terminan en él.
export async function dayOf(ask: Ask, date: string, today: string): Promise<AuditDay> {
  const days = weekEndingOn(date);
  const spans = days.map((one): Span => {
    const { from, until } = instantsOf({ from: one, until: one });
    return [from, until];
  });
  const found = await ask.spans({}, spans);
  const week = days.map((one, i) => dayCount(one, found[i] as Record<string, number>));
  const range = instantsOf({ from: date, until: date });
  const total = await ask.count(range);
  if (total > auditLogSettings.dayLimit) return { date, today, week, tooMany: total };
  const names = new Map((await ask.people()).map((person) => [person.userId, person.name]));
  const events = (await ask.rows(range, 0, auditLogSettings.dayLimit)).toReversed();
  return { date, today, week, events: events.map((event) => viewOf(event, names)) };
}
