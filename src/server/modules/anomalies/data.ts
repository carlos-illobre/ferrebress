// Las consultas de las anomalías (diseño de 08, § 2 y § 3): cada cambio de estado es una sola
// sentencia que mira el estado de antes, así dos pedidos a la vez no chocan.
import type {
  AnomaliesQuery,
  AnomalyKind,
  AnomalyStatus,
  AnomalySummary,
} from '@ferrebress/shared/contracts/anomalies';
import { type Kysely, sql } from 'kysely';
import type { DB } from './tables.generated.ts';

export type AnomaliesTables = DB;
type Db = Kysely<AnomaliesTables>;

export type AnomalyRow = {
  id: string;
  kind: AnomalyKind;
  subject: string;
  status: AnomalyStatus;
  summary: AnomalySummary;
  openedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  note: string | null;
  closedAt: Date | null;
};

const columns = [
  'id',
  'kind',
  'subject',
  'status',
  'summary',
  'opened_at as openedAt',
  'reviewed_by as reviewedBy',
  'reviewed_at as reviewedAt',
  'note',
  'closed_at as closedAt',
] as const;

const json = (value: unknown) => sql`${JSON.stringify(value)}::jsonb` as never;

// Lo que se lee: una página, una sola y cuántas hay abiertas.
const reads = (db: Db) => ({
  // Una página, de la más nueva a la más vieja; una más que la página, para saber si sigue.
  page: (query: AnomaliesQuery, size: number): Promise<AnomalyRow[]> =>
    db
      .selectFrom('anomalies.anomalies')
      .select(columns)
      .where('status', '=', query.status ?? 'open')
      .$if(query.kind !== undefined, (q) => q.where('kind', '=', query.kind as string))
      .$if(query.after !== undefined, (q) => q.where('id', '<', query.after as string))
      .orderBy('id', 'desc')
      .limit(size + 1)
      .execute() as Promise<AnomalyRow[]>,

  one: (id: string): Promise<AnomalyRow | undefined> =>
    db
      .selectFrom('anomalies.anomalies')
      .select(columns)
      .where('id', '=', id)
      .executeTakeFirst() as Promise<AnomalyRow | undefined>,

  openCount: async (): Promise<number> =>
    Number(
      (
        await db
          .selectFrom('anomalies.anomalies')
          .select((eb) => eb.fn.countAll().as('count'))
          .where('status', '=', 'open')
          .executeTakeFirstOrThrow()
      ).count,
    ),
});

// Lo que hace cada capítulo: abrir y cerrar.
const chapters = (db: Db) => ({
  // Abre una; si ya hay una abierta o revisada de la misma cosa, le pone al día lo que muestra y la
  // vuelve a abrir: lo encontrado otra vez se tiene que volver a mirar.
  async open(
    id: string,
    kind: AnomalyKind,
    subject: string,
    summary: AnomalySummary,
    at: Date,
  ): Promise<void> {
    await db
      .insertInto('anomalies.anomalies')
      .values({ id, kind, subject, status: 'open', summary: json(summary), opened_at: at })
      .onConflict((conflict) =>
        conflict
          .columns(['kind', 'subject'])
          .where('status', '<>', 'closed')
          .doUpdateSet({
            summary: json(summary),
            status: 'open',
            reviewed_by: null,
            reviewed_at: null,
            note: null,
          }),
      )
      .execute();
  },

  // Cierra las que siguen sin cerrar de esa cosa; con `kind`, solo las de ese tipo. Devuelve cuántas.
  async close(subject: string, at: Date, kind?: AnomalyKind): Promise<number> {
    const result = await db
      .updateTable('anomalies.anomalies')
      .set({ status: 'closed', closed_at: at })
      .where('subject', '=', subject)
      .where('status', '<>', 'closed')
      .$if(kind !== undefined, (q) => q.where('kind', '=', kind as string))
      .executeTakeFirst();
    return Number(result.numUpdatedRows);
  },
});

// Lo que hace una persona: marcarla revisada y volver a abrirla.
const people = (db: Db) => ({
  // Revisada, solo si estaba abierta (R9.4).
  review: (id: string, by: string, at: Date, note: string | null) =>
    db
      .updateTable('anomalies.anomalies')
      .set({ status: 'reviewed', reviewed_by: by, reviewed_at: at, note })
      .where('id', '=', id)
      .where('status', '=', 'open')
      .returning(columns)
      .executeTakeFirst() as Promise<AnomalyRow | undefined>,

  // Abierta otra vez, solo si estaba revisada (R9.4).
  reopen: (id: string) =>
    db
      .updateTable('anomalies.anomalies')
      .set({ status: 'open', reviewed_by: null, reviewed_at: null, note: null })
      .where('id', '=', id)
      .where('status', '=', 'reviewed')
      .returning(columns)
      .executeTakeFirst() as Promise<AnomalyRow | undefined>,
});

export const anomaliesData = (db: Db) => ({ ...reads(db), ...chapters(db), ...people(db) });

export type AnomaliesData = ReturnType<typeof anomaliesData>;
