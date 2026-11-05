// Leer Quién hizo qué (diseño de 05, § 5): las piezas con que el módulo arma cada pedido, sobre los
// archivos de cada año, con los índices de schema.ts. Solo lee, y nunca abre un archivo que no existe.
// Corre igual en el hilo de lectura (thread.ts) y, con la auditoría en memoria, en el mismo hilo.
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import { decode, type EventRow } from './codec.ts';
import type { PersonUpdate, StoredEvent, Tone } from './event.ts';
import { toneCodes } from './schema.ts';
import { type Filter, type Latest, where } from './where.ts';

// De dónde se lee: los años que hay, el archivo de uno y el de las personas.
export type Source = {
  years(): number[];
  file(year: number): DatabaseSync | undefined;
  people(): DatabaseSync | undefined;
};

export type { Filter, Latest } from './where.ts';

export type Request =
  | { op: 'count'; filter: Filter }
  | { op: 'rows'; filter: Filter; offset: number; limit: number }
  | { op: 'tones'; filter: Filter }
  | { op: 'spans'; filter: Filter; spans: Span[] }
  | { op: 'marks'; filter: Filter; limit: number }
  | { op: 'latest' }
  | { op: 'newer'; filter: Filter; since: Latest; limit: number }
  | { op: 'people' };

// Un tramo [desde, hasta) en milisegundos: un día de una página o de la semana de la cinta.
export type Span = [number, number];
export type Mark = { id: string; at: number; tone: Tone };
export type Answer =
  | number
  | StoredEvent[]
  | Record<Tone, number>
  | Record<Tone, number>[]
  | Mark[]
  | Latest
  | PersonUpdate[];

const toneNames = Object.keys(toneCodes) as Tone[];
export const maxClosedTotals = 1_000;

// Lo que comparten las consultas: de dónde se lee y los totales de los años cerrados, que se
// guardan porque no cambian.
type Reading = { source: Source; currentYear: () => number; closedTotals: Map<string, number> };

const fileOf = ({ source }: Reading, year: number) => source.file(year) as DatabaseSync;

const yearsOf = ({ source }: Reading, filter: Filter) =>
  source
    .years()
    .filter(
      (year) =>
        (filter.from === undefined || year >= new Date(filter.from).getUTCFullYear()) &&
        (filter.until === undefined || year <= new Date(filter.until - 1).getUTCFullYear()),
    );

function countIn(reading: Reading, year: number, filter: Filter): number {
  const key = `${year}|${JSON.stringify(filter)}`;
  const saved = reading.closedTotals.get(key);
  if (saved !== undefined) return saved;
  const { sql, params } = where(filter, year);
  const row = fileOf(reading, year)
    .prepare(`select count(*) as n from events where ${sql}`)
    .get(...params);
  const total = (row as { n: number }).n;
  if (year >= reading.currentYear()) return total;
  // Con un tope: tantas combinaciones de filtros distintas no se guardan para siempre.
  if (reading.closedTotals.size >= maxClosedTotals) reading.closedTotals.clear();
  reading.closedTotals.set(key, total);
  return total;
}

const count = (reading: Reading, filter: Filter) =>
  yearsOf(reading, filter).reduce((sum, year) => sum + countIn(reading, year, filter), 0);

// De la más nueva a la más vieja, salteando `offset`, recorriendo los años en orden. Se cuenta un año
// solo si hay que saltearlo entero: la primera página no cuenta de nuevo lo que ya contó el total.
function rows(reading: Reading, filter: Filter, offset: number, limit: number): StoredEvent[] {
  const found: StoredEvent[] = [];
  let skip = offset;
  for (const year of yearsOf(reading, filter)) {
    if (skip > 0) {
      const inYear = countIn(reading, year, filter);
      if (skip >= inYear) {
        skip -= inYear;
        continue;
      }
    }
    const { sql, params } = where(filter, year);
    const page = fileOf(reading, year)
      .prepare(`select * from events where ${sql} order by at desc, id desc limit ? offset ?`)
      .all(...params, limit - found.length, skip) as EventRow[];
    found.push(...page.map((row) => decode(row, year)));
    skip = 0;
    if (found.length === limit) break;
  }
  return found;
}

function tones(reading: Reading, filter: Filter): Record<Tone, number> {
  const totals: Record<Tone, number> = { plain: 0, amber: 0, red: 0 };
  for (const year of yearsOf(reading, filter)) {
    const { sql, params } = where(filter, year);
    const found = fileOf(reading, year)
      .prepare(`select tone, count(*) as n from events where ${sql} group by tone`)
      .all(...params) as { tone: number; n: number }[];
    for (const row of found) totals[toneNames[row.tone] as Tone] += row.n;
  }
  return totals;
}

// Cuántas de cada color hay en cada tramo, en una consulta por archivo y no una por tramo.
function spans(reading: Reading, filter: Filter, wanted: Span[]): Record<Tone, number>[] {
  const totals = wanted.map(() => ({ plain: 0, amber: 0, red: 0 }));
  if (wanted.length === 0) return totals;
  const covering = {
    ...filter,
    from: Math.min(...wanted.map(([from]) => from)),
    until: Math.max(...wanted.map(([, until]) => until)),
  };
  const sums = wanted.map((_, i) => `sum(at >= ? and at < ?) as s${i}`).join(', ');
  for (const year of yearsOf(reading, covering)) {
    const { sql, params } = where(covering, year);
    const found = fileOf(reading, year)
      .prepare(`select tone, ${sums} from events where ${sql} group by tone`)
      .all(...wanted.flat(), ...params) as Record<string, number>[];
    for (const row of found)
      for (const [i, total] of totals.entries())
        total[toneNames[row.tone as number] as Tone] += row[`s${i}`] as number;
  }
  return totals;
}

// Lo de un período, de la más vieja a la más nueva: la tira y la cinta.
function marks(reading: Reading, filter: Filter, limit: number): Mark[] {
  return yearsOf(reading, filter)
    .toReversed()
    .flatMap((year) => {
      const { sql, params } = where(filter, year);
      const found = fileOf(reading, year)
        .prepare(`select id, at, tone from events where ${sql} order by at, id limit ?`)
        .all(...params, limit) as { id: number; at: number; tone: number }[];
      return found.map((row) => ({
        id: `${year}:${row.id}`,
        at: row.at,
        tone: toneNames[row.tone] as Tone,
      }));
    })
    .slice(0, limit);
}

function people({ source }: Reading): PersonUpdate[] {
  const found = (source.people()?.prepare('select * from people order by name').all() ?? []) as {
    user_id: string;
    name: string;
    email: string | null;
    state: PersonUpdate['state'];
  }[];
  return found.map((row) => ({
    userId: row.user_id,
    name: row.name,
    state: row.state,
    ...(row.email && { email: row.email }),
  }));
}

// La última fila de cada archivo vivo: de dónde se cuentan las nuevas.
function latest(reading: Reading): Latest {
  const current = reading.currentYear();
  return [current - 1, current].map((year): [number, number] => {
    if (!reading.source.years().includes(year)) return [year, 0];
    const row = fileOf(reading, year).prepare('select coalesce(max(id), 0) as n from events').get();
    return [year, (row as { n: number }).n];
  });
}

// Cuántas llegaron después de `since` con los filtros, hasta `limit`: el «3 nuevas» (R4.6). Una
// consulta por archivo vivo que existe, que no recorre más que `limit` de las que cumplen.
function newer(reading: Reading, filter: Filter, since: Latest, limit: number): number {
  let found = 0;
  for (const [year, after] of since) {
    if (found >= limit || !reading.source.years().includes(year)) continue;
    const { sql, params } = where(filter, year);
    const row = fileOf(reading, year)
      .prepare(`select count(*) as n from (select 1 from events where ${sql} and id > ? limit ?)`)
      .get(...params, after, limit - found);
    found += (row as { n: number }).n;
  }
  return found;
}

// `currentYear`: el año en curso; los totales de los anteriores se guardan, porque no cambian.
export function createQuery(source: Source, currentYear: () => number) {
  const reading: Reading = { source, currentYear, closedTotals: new Map() };
  return (request: Request): Answer => {
    switch (request.op) {
      case 'count':
        return count(reading, request.filter);
      case 'rows':
        return rows(reading, request.filter, request.offset, request.limit);
      case 'tones':
        return tones(reading, request.filter);
      case 'spans':
        return spans(reading, request.filter, request.spans);
      case 'marks':
        return marks(reading, request.filter, request.limit);
      case 'latest':
        return latest(reading);
      case 'newer':
        return newer(reading, request.filter, request.since, request.limit);
      default:
        return people(reading);
    }
  };
}

export type Query = ReturnType<typeof createQuery>;
