// Lo que comparten las consultas del catálogo: las filas que viajan como un JSON (un solo parámetro,
// sea cual sea el tamaño de la tanda) y lo que hace falta para calcular el precio de un producto.
import { type RawBuilder, sql } from 'kysely';

// Los costos, en millonésimos, como texto: en un JSON un número tan grande pierde precisión.
export const rowsOf = (rows: readonly object[]): RawBuilder<unknown> =>
  sql`${JSON.stringify(rows, (_key, value) => (typeof value === 'bigint' ? String(value) : value))}::jsonb`;

export type Priced = { id: string; cost: string | null; margin: number | null; vat: number };
