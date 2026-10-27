import { Kysely, PostgresDialect, sql } from 'kysely';
import { type Migration, Migrator } from 'kysely/migration';
import pg from 'pg';

// La base de cada módulo: su esquema y sus migraciones, que corren en el orden en que se
// registran los módulos. Cada módulo lleva su propia tabla de migraciones en su esquema.
export type ModuleSchema = { schema: string; migrations: Record<string, Migration> };

export const inMemoryUrl = 'memory://';

// PostgreSQL de verdad; con `memory://`, PGlite dentro del proceso (ADR-005). PGlite solo
// está en las dependencias de desarrollo: se carga recién si se pide.
export async function openDatabase<T>(url: string): Promise<Kysely<T>> {
  if (url !== inMemoryUrl) {
    return new Kysely<T>({
      dialect: new PostgresDialect({ pool: new pg.Pool({ connectionString: url }) }),
    });
  }
  const [{ PGlite }, { PGliteDialect }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('kysely-pglite-dialect'),
  ]);
  return new Kysely<T>({ dialect: new PGliteDialect(new PGlite()) });
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
