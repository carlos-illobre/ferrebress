// La base de datos (ADR-009): abre PostgreSQL, o PGlite en las pruebas (ADR-005), y corre las
// migraciones de cada módulo en su esquema.
import { Kysely, PostgresDialect, sql } from 'kysely';
import { type Migration, Migrator } from 'kysely/migration';
import pg from 'pg';

// Cada módulo lleva su propia tabla de migraciones en su esquema, y migra en el orden en que se
// registra.
export type ModuleSchema = { schema: string; migrations: Record<string, Migration> };

export const inMemoryUrl = 'memory://';

// PostgreSQL de verdad; con `memory://`, PGlite dentro del proceso (ADR-005). PGlite solo
// está en las dependencias de desarrollo: se carga recién si se pide. `onQuery` se entera de cada
// consulta: así las pruebas cuentan cuántas hace cada pedido (diseño de 01, § 12).
export async function openDatabase<T>(url: string, onQuery?: () => void): Promise<Kysely<T>> {
  const log = onQuery && { log: () => onQuery() };
  if (url !== inMemoryUrl) {
    return new Kysely<T>({
      dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: url }) }),
      ...log,
    });
  }
  const [{ PGlite }, { PGliteDialect }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('kysely-pglite-dialect'),
  ]);
  return new Kysely<T>({ dialect: new PGliteDialect(new PGlite()), ...log });
}

export async function migrate(db: Kysely<unknown>, modules: ModuleSchema[]): Promise<void> {
  for (const { schema, migrations } of modules) {
    await sql`create schema if not exists ${sql.id(schema)}`.execute(db);
    const migrator = new Migrator({
      db,
      provider: { getMigrations: async () => migrations },
      migrationTableSchema: schema,
    });
    const { error } = await migrator.migrateToLatest();
    if (error) throw error;
  }
}
