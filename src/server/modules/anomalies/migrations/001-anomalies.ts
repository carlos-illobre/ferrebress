// La tabla de las anomalías (06 · R9; diseño de 08, § 2): una fila por cosa que alguien tiene que
// mirar, con su estado. Una sola abierta o revisada por cosa: volver a encontrarla la pone al día.
import { type Kysely, sql } from 'kysely';
import type { Migration } from 'kysely/migration';

export const createAnomalies: Migration = {
  async up(db: Kysely<unknown>) {
    const schema = db.schema.withSchema('anomalies');
    await schema
      .createTable('anomalies')
      .addColumn('id', 'uuid', (col) => col.primaryKey())
      .addColumn('kind', 'text', (col) => col.notNull())
      .addColumn('subject', 'text', (col) => col.notNull())
      .addColumn('status', 'text', (col) =>
        col.notNull().check(sql`status in ('open', 'reviewed', 'closed')`),
      )
      .addColumn('summary', 'jsonb', (col) => col.notNull())
      .addColumn('opened_at', 'timestamptz', (col) => col.notNull())
      .addColumn('reviewed_by', 'uuid')
      .addColumn('reviewed_at', 'timestamptz')
      .addColumn('note', 'text', (col) => col.check(sql`char_length(note) <= 500`))
      .addColumn('closed_at', 'timestamptz')
      .execute();
    // La lista, por estado y de la más nueva a la más vieja (el identificador es UUID v7: su orden es
    // el de cuándo se abrió).
    await schema
      .createIndex('anomalies_by_status')
      .on('anomalies')
      .columns(['status', 'id desc'])
      .execute();
    await schema
      .createIndex('anomalies_one_per_subject')
      .on('anomalies')
      .columns(['kind', 'subject'])
      .unique()
      .where(sql.ref('status'), '<>', 'closed')
      .execute();
  },
};
