// Las reglas de la pantalla de Quién hizo qué (capítulo 05), sin dibujo: qué se le pide al servidor
// según los filtros (R4.5, R4.9), cómo se dicen las horas en la zona del negocio (00 · R8.4) y cómo
// se agrupan las acciones por día.
import type {
  AuditPerson,
  AuditView,
  Range,
  StripMark,
} from '@ferrebress/shared/contracts/audit-log';
import { addDays, businessFormat } from '@ferrebress/shared/time/business';
import { formatTime } from '../../platform/time.ts';

export type Who = string | 'system' | 'outsider' | undefined;
export type Dates = { range: Range } | { from: string; until: string } | undefined;
export type Kind = { group: string } | { type: string } | { tone: 'amber' | 'red' } | undefined;
export type Filters = { by: Who; to: string | undefined; dates: Dates; kind: Kind };

export const noFilters: Filters = {
  by: undefined,
  to: undefined,
  dates: undefined,
  kind: undefined,
};

export const hasFilters = (filters: Filters) =>
  Object.values(filters).some((value) => value !== undefined);

// Lo que se le pide al servidor (§ 5), en un orden fijo.
export function paramsOf(
  filters: Filters,
  page: { page: number; size: number },
  extra: { summary?: boolean; strip?: boolean } = {},
): Record<string, string | number | undefined> {
  const { dates, kind } = filters;
  const pick = (from: object | undefined, key: string) =>
    (from as Record<string, string> | undefined)?.[key];
  return {
    page: page.page,
    size: page.size,
    by: filters.by,
    to: filters.to,
    range: pick(dates, 'range'),
    from: pick(dates, 'from'),
    until: pick(dates, 'until'),
    group: pick(kind, 'group'),
    type: pick(kind, 'type'),
    tone: pick(kind, 'tone'),
    summary: extra.summary ? '1' : undefined,
    strip: extra.strip ? '1' : undefined,
  };
}

const dateFormat = () => businessFormat('es-AR', { day: 'numeric', month: 'numeric' });
const longDate = () =>
  businessFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
const dayOf = () => businessFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });

export const timeOf = (iso: string) => formatTime(new Date(iso));
export const shortDateOf = (iso: string) => dateFormat().format(new Date(iso));
export const businessDay = (iso: string) => dayOf().format(new Date(iso));

// «Hoy, miércoles 4 de noviembre», «Ayer, …» o la fecha sola.
export function dayTitle(date: string, today: string): string {
  const long = longDate().format(new Date(`${date}T15:00:00Z`));
  if (date === today) return `Hoy, ${long}`;
  if (date === addDays(today, -1)) return `Ayer, ${long}`;
  return long.charAt(0).toUpperCase() + long.slice(1);
}

// Las acciones de la página, juntas por día, en el orden en que vienen.
export function byDay(events: AuditView[]): { date: string; events: AuditView[] }[] {
  const days: { date: string; events: AuditView[] }[] = [];
  for (const event of events) {
    const date = businessDay(event.at);
    const last = days.at(-1);
    if (last?.date === date) last.events.push(event);
    else days.push({ date, events: [event] });
  }
  return days;
}

// Las iniciales de un nombre, para su círculo.
export { initials } from '../../platform/text.ts';

// Las personas del filtro, en orden, con su marca si ya no están activas.
export const sortedPeople = (people: AuditPerson[]) =>
  people.toSorted((a, b) => a.name.localeCompare(b.name, 'es'));

// El navegador y el sistema, dichos (de los códigos de la plataforma).
const browsers: Record<string, string> = {
  edge: 'Edge',
  firefox: 'Firefox',
  chrome: 'Chrome',
  safari: 'Safari',
};
const systems: Record<string, string> = {
  android: 'Android',
  iphone: 'iPhone',
  windows: 'Windows',
  macos: 'macOS',
  linux: 'Linux',
};
export function browserOf(device: AuditView['device']): string | undefined {
  const browser = device?.browser && browsers[device.browser];
  const system = device?.os && systems[device.os];
  return browser && system ? `${browser} en ${system}` : (browser ?? system);
}

// El día del resumen, el de la tira y el que abre «Ver el día» (E41): hoy, ayer o el elegido; con un
// período de varios días, hoy.
export function summaryDay(dates: Dates, today: string): string {
  if (dates && 'from' in dates) return dates.from === dates.until ? dates.from : today;
  return dates?.range === 'yesterday' ? addDays(today, -1) : today;
}

// Tocar la tira: la raya más cercana a donde se tocó, de 0 a 1.
export const nearestMark = (strip: StripMark[], place: (at: number) => number, at: number) =>
  strip.reduce((best, mark) =>
    Math.abs(place(mark.at) - at) < Math.abs(place(best.at) - at) ? mark : best,
  );

// El tramo de la tira: de la hora en punto antes de la primera acción a la de después de la última,
// con al menos 3 horas; y las horas que se escriben debajo (de a una, o de a dos si es largo).
export function stripScale(seconds: number[]) {
  const hour = 3600;
  const start = Math.floor(Math.min(...seconds) / hour) * hour;
  const end = Math.max(start + 3 * hour, Math.ceil((Math.max(...seconds) + 1) / hour) * hour);
  const every = end - start > 12 * hour ? 2 : 1;
  const hours: number[] = [];
  for (let at = start; at <= end; at += every * hour) hours.push(at / hour);
  return { place: (at: number) => (at - start) / (end - start), hours };
}

// Si una acción llegó después de la foto `latest` de una lista anterior (diseño de 05, § 5): su fila
// es mayor que la última de su archivo, o es de un año posterior a todos (R4.6, la marca de lo que
// entra).
export function isNewer(id: string, latest: string): boolean {
  const [year, row] = id.split(':').map(Number) as [number, number];
  const last = new Map(
    latest.split('.').map((part) => part.split(':').map(Number) as [number, number]),
  );
  const known = last.get(year);
  return known === undefined ? year > Math.max(...last.keys()) : row > known;
}
