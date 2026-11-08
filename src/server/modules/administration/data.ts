// Las consultas de los ajustes (diseño de 06, § 2): leer todos al arrancar y guardar uno con la
// versión que se vio, en una sola sentencia.
import { type Kysely, sql } from 'kysely';
import type { DB } from './tables.generated.ts';

export type AdministrationTables = DB;
type Db = Kysely<AdministrationTables>;

export type StoredSetting = { key: string; value: unknown; version: number; changedBy: string };

export const administrationData = (db: Db) => ({
  all: (): Promise<StoredSetting[]> =>
    db
      .selectFrom('administration.settings')
      .select(['key', 'value', 'version', 'changed_by as changedBy'])
      .execute() as Promise<StoredSetting[]>,

  // Con la versión 0 (nunca cambió) inserta, y si ya hay fila no hace nada; con otra, actualiza solo
  // si sigue siendo esa. Si otro cambió antes, no devuelve nada: dos primeros cambios a la vez no
  // chocan al insertar (diseño de 06, § 2).
  async save(key: string, value: unknown, seen: number, by: string): Promise<number | undefined> {
    // Como texto y convertido en la base: un arreglo, pasado tal cual, el controlador lo manda como
    // arreglo de PostgreSQL y no como JSON.
    const json = sql`${JSON.stringify(value)}::jsonb` as never;
    const row =
      seen === 0
        ? await db
            .insertInto('administration.settings')
            .values({ key, value: json, version: 1, changed_by: by })
            .onConflict((conflict) => conflict.column('key').doNothing())
            .returning('version')
            .executeTakeFirst()
        : await db
            .updateTable('administration.settings')
            .set({ value: json, version: seen + 1, changed_by: by })
            .where('key', '=', key)
            .where('version', '=', seen)
            .returning('version')
            .executeTakeFirst();
    return row?.version;
  },

  // Quién lo cambió por última vez, para decirlo cuando otro choca con ese cambio.
  changedBy: async (key: string): Promise<string | undefined> =>
    (
      await db
        .selectFrom('administration.settings')
        .select('changed_by')
        .where('key', '=', key)
        .executeTakeFirst()
    )?.changed_by,
});
