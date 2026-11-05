// Las condiciones de cada consulta (query.ts), siempre como parámetros: nunca se arma la consulta con
// lo que llega de afuera.
import type { SQLInputValue } from 'node:sqlite';
import type { Tone } from './event.ts';
import { actorCodes, toneCodes } from './schema.ts';

// Lo que filtra: instantes en milisegundos (`until`, sin incluir), quién, a quién, tipos y color.
export type Filter = {
  from?: number;
  until?: number;
  actor?: { userId: string } | 'system' | 'outsider';
  target?: string;
  types?: string[];
  tone?: Exclude<Tone, 'plain'>;
  // La foto del pedido: de cada archivo vivo, hasta qué fila; lo escrito después no entra, y un año
  // posterior a todos estos tampoco (diseño de 05, § 5).
  upTo?: Latest;
};

// De cada archivo vivo (el año UTC en curso y el anterior), su última fila; 0 si todavía no existe.
export type Latest = [year: number, id: number][];

// Hasta qué fila de ese año entra en la foto del pedido.
function upToOf({ upTo }: Filter, year: number): [string, SQLInputValue[]][] {
  if (!upTo) return [];
  const found = upTo.find(([one]) => one === year);
  if (found) return [['id <= ?', [found[1]]]];
  return year > Math.max(...upTo.map(([one]) => one)) ? [['0 = 1', []]] : [];
}

// Las condiciones de un archivo: los filtros y la foto del pedido.
export function where(filter: Filter, year: number): { sql: string; params: SQLInputValue[] } {
  const parts: [string, SQLInputValue[]][] = [['1 = 1', []], ...upToOf(filter, year)];
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
