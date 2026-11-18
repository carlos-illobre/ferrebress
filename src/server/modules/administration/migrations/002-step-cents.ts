// El paso del redondeo pasa a centavos (06 · R3.2, T136): el guardado en pesos se multiplica por 100,
// y 0, que era «sin redondeo», pasa a 1, un centavo.
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export const stepInCents: Migration = {
  async up(db: Kysely<unknown>) {
    await sql`
      update administration.settings
      set value = to_jsonb(greatest((value #>> '{}')::bigint * 100, 1))
      where key = 'roundingStep'`.execute(db);
  },
};
