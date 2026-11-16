// Lo común a las consultas de las listas de precios: el tipo de la base y cómo viajan las filas en
// lote (un solo parámetro JSON, con los millonésimos como texto para no perder precisión).
import { type Kysely, type RawBuilder, sql } from 'kysely';
import type { DB } from '../tables.generated.ts';

export type PriceListsTables = DB;
export type Db = Kysely<PriceListsTables>;

export const asDb = (db: Kysely<unknown>): Db => db as Db;

export const jsonOf = (value: unknown): RawBuilder<never> =>
  sql`${JSON.stringify(value, (_key, inner) => (typeof inner === 'bigint' ? String(inner) : inner))}::jsonb` as RawBuilder<never>;

// Una fecha de la base como texto, sin pasar por la zona horaria de nadie.
export const dateText = (column: string) => sql<string | null>`${sql.ref(column)}::text`;

// Un `bigint` como texto: `pg` lo da así, pero PGlite lo da como número y pierde precisión pasado
// 2^53. Los millonésimos de $ 1 billón ya lo pasan.
export const bigText = (column: string) => sql<string>`${sql.ref(column)}::text`;
