// Las reglas de Quién hizo qué (capítulo 05), sin tecnología: de lo que se pide a los filtros
// (R4.5), los atajos de fecha con el día del servidor (R4.5, principio VI) y cómo se muestra cada
// acción, solo con lo que puede salir (diseño de 05, § 2.2).

import {
  entryOf,
  type Group,
  isGroup,
  shownData,
  typesOf,
} from '@ferrebress/shared/audit-log/index';
import type {
  ActorView,
  AuditQuery,
  AuditView,
  DayCount,
  Range,
  StripMark,
  TargetView,
} from '@ferrebress/shared/contracts/audit-log';
import {
  addDays,
  type BusinessDate,
  businessDateOf,
  firstOfMonth,
  mondayOf,
  startOfBusinessDate,
} from '@ferrebress/shared/time/business';
import { auditLogSettings } from './settings.ts';

// Lo que entiende la consulta (platform/storage/audit/query.ts), sin importarla: es tecnología.
export type Filter = {
  from?: number;
  until?: number;
  actor?: { userId: string } | 'system' | 'outsider';
  target?: string;
  types?: string[];
  tone?: 'amber' | 'red';
};
export type Period = { from: BusinessDate; until: BusinessDate };
export type Stored = {
  id: string;
  type: string;
  at: Date;
  tone: AuditView['tone'];
  actor:
    | { kind: 'person'; userId: string; name?: string }
    | { kind: 'system' }
    | { kind: 'outsider'; email?: string };
  targets?: { kind: string; id: string; name?: string }[];
  changes?: AuditView['changes'];
  data?: Record<string, unknown>;
  device?: AuditView['device'];
  ipAddress?: string;
  arrivedAt?: Date;
  deviceTime?: Date;
  truncated?: true;
};

// Nada anterior a esto: el sistema no existía.
export const firstDate = '2020-01-01';

// Los atajos (R4.5), con el día del servidor (constitución, VI).
const ranges: Record<Range, (today: BusinessDate) => Period> = {
  today: (today) => ({ from: today, until: today }),
  yesterday: (today) => ({ from: addDays(today, -1), until: addDays(today, -1) }),
  week: (today) => ({ from: mondayOf(today), until: today }),
  month: (today) => ({ from: firstOfMonth(today), until: today }),
};

// El período que piden las fechas: un atajo o desde y hasta. Un error dice qué campo está mal.
export function periodOf(query: AuditQuery, today: BusinessDate): Period | undefined | string {
  const { range, from, until } = query;
  if (range) return from || until ? 'range' : ranges[range](today);
  if (!from && !until) return undefined;
  const period = { from: from ?? firstDate, until: until ?? today };
  return periodError(period, today) ?? period;
}

function periodError({ from, until }: Period, today: BusinessDate): string | undefined {
  if (from < firstDate || from > until) return 'from';
  return until > today ? 'until' : undefined;
}

export const instantsOf = ({ from, until }: Period) => ({
  from: startOfBusinessDate(from).getTime(),
  until: startOfBusinessDate(addDays(until, 1)).getTime(),
});

// Qué campo del tipo no sirve: el color no va con grupo ni tipo, el grupo y el tipo existen, y el
// tipo es de ese grupo.
function kindError({ tone, group, type }: AuditQuery): string | undefined {
  if (tone && (group || type)) return 'tone';
  if (group && !isGroup(group)) return 'group';
  const ofType = type && entryOf(type).group;
  if (ofType === 'other' || (ofType && group && ofType !== group)) return 'type';
  return undefined;
}

const typesFor = ({ group, type }: AuditQuery) =>
  type ? { types: [type] } : group ? { types: typesOf(group as Group) } : {};

const actorFor = (by: AuditQuery['by']): Pick<Filter, 'actor'> =>
  by === 'system' || by === 'outsider' ? { actor: by } : by ? { actor: { userId: by } } : {};

// Los filtros de la lista, o el campo que no sirve.
export function filterOf(query: AuditQuery, period: Period | undefined): Filter | string {
  return (
    kindError(query) ?? {
      ...(period && instantsOf(period)),
      ...actorFor(query.by),
      ...(query.to && { target: query.to }),
      ...typesFor(query),
      ...(query.tone && { tone: query.tone }),
    }
  );
}

// El día del negocio de cada acción de la página, con su período, para contar cuántas tiene.
export const daysOf = (events: Stored[]): BusinessDate[] => [
  ...new Set(events.map((event) => businessDateOf(event.at))),
];

// Una acción como la ve quien tiene el permiso: con el nombre de hoy si cambió, y solo los datos
// que su tipo muestra.
export function viewOf(event: Stored, namesToday: Map<string, string>): AuditView {
  const today = (id: string, name?: string) => {
    const now = namesToday.get(id);
    return now && now !== name ? { today: now } : {};
  };
  const target = (one: { kind: string; id: string; name?: string }): TargetView => ({
    ...one,
    ...(one.kind === 'person' && today(one.id, one.name)),
  });
  const { actor } = event;
  const actorView: ActorView =
    actor.kind === 'person'
      ? {
          kind: 'person',
          id: actor.userId,
          ...(actor.name && { name: actor.name }),
          ...today(actor.userId, actor.name),
        }
      : actor;
  return {
    id: event.id,
    at: event.at.toISOString(),
    type: event.type,
    tone: event.tone,
    actor: actorView,
    targets: (event.targets ?? []).map(target),
    changes: event.changes ?? {},
    data: shownData(event.type, event.data),
    ...(event.device && { device: event.device }),
    ...(event.ipAddress && { ipAddress: event.ipAddress }),
    ...(event.arrivedAt && { arrivedAt: event.arrivedAt.toISOString() }),
    ...(event.deviceTime && { deviceTime: event.deviceTime.toISOString() }),
    ...(event.truncated && { truncated: true }),
  };
}

export type Mark = { id: string; at: number; tone: AuditView['tone'] };

// La tira de un día (R4.9): una raya por acción; con más de 2.000, la más nueva de cada minuto.
export function stripOf(marks: Mark[], dayStart: number): StripMark[] {
  const seconds = (at: number) => Math.floor((at - dayStart) / 1000);
  if (marks.length <= auditLogSettings.dayLimit)
    return marks.map((mark) => ({ ...mark, at: seconds(mark.at) }));
  const byMinute = new Map<number, StripMark>();
  for (const mark of marks) {
    const at = seconds(mark.at);
    byMinute.set(Math.floor(at / 60), { ...mark, at });
  }
  return [...byMinute.values()];
}

// Los siete días que terminan en ese, para los días de arriba de la cinta (R4.11).
export const weekEndingOn = (date: BusinessDate): BusinessDate[] =>
  [6, 5, 4, 3, 2, 1, 0].map((back) => addDays(date, -back));

export const dayCount = (date: BusinessDate, tones: Record<string, number>): DayCount => ({
  date,
  total: (tones.plain ?? 0) + (tones.amber ?? 0) + (tones.red ?? 0),
  amber: tones.amber ?? 0,
  red: tones.red ?? 0,
});
