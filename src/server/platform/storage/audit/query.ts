// Leer Quién hizo qué (diseño de 05, § 5): las piezas con que el módulo arma cada pedido, sobre los
// archivos de cada año, con los índices de schema.ts. Solo lee, y nunca abre un archivo que no existe.
// Corre igual en el hilo de lectura (thread.ts) y, con la auditoría en memoria, en el mismo hilo.
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import { decode, type EventRow } from './codec.ts';
import type { PersonUpdate, StoredEvent, Tone } from './event.ts';
import { actorCodes, toneCodes } from './schema.ts';

// De dónde se lee: los años que hay, el archivo de uno y el de las personas.
export type Source = {
  years(): number[];
  file(year: number): DatabaseSync | undefined;
  people(): DatabaseSync | undefined;
};

// Lo que filtra: instantes en milisegundos (`until`, sin incluir), quién, a quién, tipos y color.
export type Filter = {
  from?: number;
  until?: number;
  actor?: { userId: string } | 'system' | 'outsider';
  target?: string;
  types?: string[];
  tone?: Exclude<Tone, 'plain'>;
};

export type Request =
  | { op: 'count'; filter: Filter }
  | { op: 'rows'; filter: Filter; offset: number; limit: number }
  | { op: 'position'; filter: Filter; id: string }
  | { op: 'tones'; filter: Filter }
  | { op: 'marks'; filter: Filter; limit: number }
  | { op: 'people' };

export type Mark = { id: string; at: number; tone: Tone };
export type Answer =
  | number
  | StoredEvent[]
  | { position: number }
  | null
  | Record<Tone, number>
  | Mark[]
  | PersonUpdate[];

const toneNames = Object.keys(toneCodes) as Tone[];

// `currentYear`: el año en curso; los totales de los anteriores se guardan, porque no cambian.
export function createQuery(source: Source, currentYear: () => number) {
  const closedTotals = new Map<string, number>();

  const yearsOf = (filter: Filter) =>
    source
      .years()
      .filter(
        (year) =>
          (filter.from === undefined || year >= new Date(filter.from).getUTCFullYear()) &&
          (filter.until === undefined || year <= new Date(filter.until - 1).getUTCFullYear()),
      );
  const countIn = (year: number, filter: Filter): number => {
    const key = `${year}|${JSON.stringify(filter)}`;
    const saved = closedTotals.get(key);
    if (saved !== undefined) return saved;
    const { sql, params } = where(filter);
    const row = fileOf(year)
      .prepare(`select count(*) as n from events where ${sql}`)
      .get(...params);
    const total = (row as { n: number }).n;
    if (year < currentYear()) closedTotals.set(key, total);
    return total;
  };
  const fileOf = (year: number) => source.file(year) as DatabaseSync;

  const count = (filter: Filter) =>
    yearsOf(filter).reduce((sum, year) => sum + countIn(year, filter), 0);

  // De la más nueva a la más vieja, salteando `offset`, recorriendo los años en orden.
  function rows(filter: Filter, offset: number, limit: number): StoredEvent[] {
    const found: StoredEvent[] = [];
    let skip = offset;
    for (const year of yearsOf(filter)) {
      const inYear = countIn(year, filter);
      if (skip >= inYear) {
        skip -= inYear;
        continue;
      }
      const { sql, params } = where(filter);
      const page = fileOf(year)
        .prepare(`select * from events where ${sql} order by at desc, id desc limit ? offset ?`)
        .all(...params, limit - found.length, skip) as EventRow[];
      found.push(...page.map((row) => decode(row, year)));
      skip = 0;
      if (found.length === limit) break;
    }
    return found;
  }

  // Cuántas acciones con esos filtros son más nuevas que esa: para saber su página. Si no coincide
  // con los filtros, o no existe, nada.
  function position(filter: Filter, id: string): { position: number } | null {
    const [year, number] = id.split(':').map(Number) as [number, number];
    if (!source.years().includes(year)) return null;
    const { sql, params } = where(filter);
    const own = fileOf(year)
      .prepare(`select at from events where id = ? and ${sql}`)
      .get(number, ...params) as { at: number } | undefined;
    if (!own) return null;
    const newer = yearsOf(filter)
      .filter((other) => other > year)
      .reduce((sum, other) => sum + countIn(other, filter), 0);
    const before = fileOf(year)
      .prepare(`select count(*) as n from events where ${sql} and (at > ? or (at = ? and id > ?))`)
      .get(...params, own.at, own.at, number) as { n: number };
    return { position: newer + before.n };
  }

  function tones(filter: Filter): Record<Tone, number> {
    const totals: Record<Tone, number> = { plain: 0, amber: 0, red: 0 };
    for (const year of yearsOf(filter)) {
      const { sql, params } = where(filter);
      const rows = fileOf(year)
        .prepare(`select tone, count(*) as n from events where ${sql} group by tone`)
        .all(...params) as { tone: number; n: number }[];
      for (const row of rows) totals[toneNames[row.tone] as Tone] += row.n;
    }
    return totals;
  }

  // Lo de un período, de la más vieja a la más nueva: la tira y la cinta.
  function marks(filter: Filter, limit: number): Mark[] {
    return yearsOf(filter)
      .toReversed()
      .flatMap((year) => {
        const { sql, params } = where(filter);
        const rows = fileOf(year)
          .prepare(`select id, at, tone from events where ${sql} order by at, id limit ?`)
          .all(...params, limit) as { id: number; at: number; tone: number }[];
        return rows.map((row) => ({
          id: `${year}:${row.id}`,
          at: row.at,
          tone: toneNames[row.tone] as Tone,
        }));
      })
      .slice(0, limit);
  }

  function people(): PersonUpdate[] {
    const rows = (source.people()?.prepare('select * from people order by name').all() ?? []) as {
      user_id: string;
      name: string;
      email: string | null;
      state: PersonUpdate['state'];
    }[];
    return rows.map((row) => ({
      userId: row.user_id,
      name: row.name,
      state: row.state,
      ...(row.email && { email: row.email }),
    }));
  }

  return (request: Request): Answer => {
    switch (request.op) {
      case 'count':
        return count(request.filter);
      case 'rows':
        return rows(request.filter, request.offset, request.limit);
      case 'position':
        return position(request.filter, request.id);
      case 'tones':
        return tones(request.filter);
      case 'marks':
        return marks(request.filter, request.limit);
      default:
        return people();
    }
  };
}

export type Query = ReturnType<typeof createQuery>;

// Las condiciones, siempre como parámetros: nunca se arma la consulta con lo que llega de afuera.
function where(filter: Filter): { sql: string; params: SQLInputValue[] } {
  const parts: [string, SQLInputValue[]][] = [['1 = 1', []]];
  if (filter.from !== undefined) parts.push(['at >= ?', [filter.from]]);
  if (filter.until !== undefined) parts.push(['at < ?', [filter.until]]);
  if (filter.actor === 'system') parts.push(['actor_kind = ?', [actorCodes.system]]);
  else if (filter.actor === 'outsider') parts.push(['actor_kind = ?', [actorCodes.outsider]]);
  else if (filter.actor) parts.push(['user_id = ?', [filter.actor.userId]]);
  if (filter.target)
    parts.push(['id in (select event_id from targets where target_id = ?)', [filter.target]]);
  if (filter.types)
    parts.push([`type in (${filter.types.map(() => '?').join(', ') || 'null'})`, filter.types]);
  if (filter.tone) parts.push(['tone = ?', [toneCodes[filter.tone]]]);
  return {
    sql: parts.map(([sql]) => sql).join(' and '),
    params: parts.flatMap(([, params]) => params),
  };
}
