// Las consultas de los archivos de las listas (08 · R4.4; 06 · R8.6, R8.7, R10): cuánto ocupan, cuáles
// borrar y marcarlos a mano, con «Deshacer».
import type { ListStatus } from '@ferrebress/shared/contracts/price-lists';
import { sql } from 'kysely';
import type { Db } from './db.ts';

export type FileLine = {
  sha: string;
  size: number;
  storedAt: Date;
  deleting: boolean;
  lists: { id: string; fileName: string; status: ListStatus; supplier?: string }[];
};

const hex = (sha: string) => Buffer.from(sha, 'hex');
// Los de una lista que se lee, se aplica o espera su turno no se borran: los necesita.
type Owner = { id: string; name: string };

const busy = sql`exists (select 1 from price_lists.lists l where l.file_sha256 = f.sha256
  and l.status in ('queued', 'reading', 'applying'))`;

const totalOf = async (db: Db): Promise<number> =>
  Number(
    (
      await sql<{
        total: string;
      }>`select coalesce(sum(size), 0)::text as total from price_lists.files`.execute(db)
    ).rows[0]?.total,
  );

// Verlos.
const listing = (db: Db) => ({
  total: () => totalOf(db),
  known: async (): Promise<Set<string>> =>
    new Set(
      (
        await sql<{
          sha: string;
        }>`select encode(sha256, 'hex') as sha from price_lists.files`.execute(db)
      ).rows.map((row) => row.sha),
    ),

  // Del más viejo al más nuevo, con las listas que usan cada uno (R10.1).
  page: async (after: [number, string] | undefined, limit: number): Promise<FileLine[]> =>
    (
      await sql<FileLine>`
        select encode(f.sha256, 'hex') as sha, f.size::int as size, f.stored_at as "storedAt",
          f.deleting_at is not null as deleting,
          coalesce((select json_agg(json_build_object('id', l.id, 'fileName', l.file_name,
            'status', l.status, 'supplier', s.name) order by l.uploaded_at)
            from price_lists.lists l left join price_lists.suppliers s on s.id = l.supplier_id
            where l.file_sha256 = f.sha256), '[]') as lists
        from price_lists.files f
        ${after ? sql`where (f.stored_at, f.sha256) > (to_timestamp(${after[0] / 1000}), ${hex(after[1])})` : sql``}
        order by f.stored_at, f.sha256 limit ${limit + 1}`.execute(db)
    ).rows,
});

// Borrar uno a mano y deshacerlo.
const byHand = (db: Db) => ({
  // Lo marca para borrar (R10.2), si no lo necesita una lista; devuelve si se pudo.
  // Lo marca para borrar; devuelve la lista más nueva que lo usaba, para Quién hizo qué.
  async mark(sha: string, at: Date): Promise<{ list: Owner } | 'in-use' | 'not-found'> {
    // Un archivo guardado es siempre de alguna lista: las listas no se borran.
    const found = await sql<{ busy: boolean; list: Owner }>`select ${busy} as busy,
        (select json_build_object('id', l.id, 'name', l.file_name) from price_lists.lists l
          where l.file_sha256 = f.sha256 order by l.uploaded_at desc limit 1) as list
      from price_lists.files f where f.sha256 = ${hex(sha)}`.execute(db);
    const row = found.rows[0];
    if (!row) return 'not-found';
    if (row.busy) return 'in-use';
    await db
      .updateTable('price_lists.files')
      .set({ deleting_at: at })
      .where('sha256', '=', hex(sha))
      .execute();
    return { list: row.list };
  },

  restore: async (sha: string): Promise<boolean> =>
    (
      await db
        .updateTable('price_lists.files')
        .set({ deleting_at: null })
        .where('sha256', '=', hex(sha))
        .where('deleting_at', 'is not', null)
        .executeTakeFirst()
    ).numUpdatedRows > 0n,
});

// Lo que se borra solo.
const cleanup = (db: Db) => ({
  // Los que hay que borrar ya (06 · R8.7, R10.2): marcados a mano con el «Deshacer» vencido, y los
  // de listas que nunca se aplicaron, pasados los días del ajuste.
  due: async (markedBefore: Date, unappliedBefore: Date): Promise<string[]> =>
    (
      await sql<{ sha: string }>`
        select encode(f.sha256, 'hex') as sha from price_lists.files f
        where not ${busy} and (f.deleting_at < ${markedBefore} or (
          not exists (select 1 from price_lists.lists l where l.file_sha256 = f.sha256
            and (l.status in ('applied', 'pending') or l.uploaded_at >= ${unappliedBefore}))))`.execute(
        db,
      )
    ).rows.map((row) => row.sha),

  // Los más viejos hasta quedar por debajo del tamaño (06 · R8.6), salvo el más nuevo y los que se
  // necesitan.
  async overflow(limitBytes: number): Promise<string[]> {
    const rows = await sql<{ sha: string; size: number }>`
      select encode(f.sha256, 'hex') as sha, f.size::int as size from price_lists.files f
      where not ${busy}
        and f.sha256 <> (select sha256 from price_lists.files order by stored_at desc, sha256 desc limit 1)
      order by f.stored_at, f.sha256`.execute(db);
    let total = await totalOf(db);
    const out: string[] = [];
    for (const row of rows.rows) {
      if (total <= limitBytes) break;
      out.push(row.sha);
      total -= row.size;
    }
    return out;
  },

  // Ya no se guarda: las listas lo dicen (R4.4) y la fila se va.
  async forget(sha: string): Promise<void> {
    await db
      .updateTable('price_lists.lists')
      .set({ file_sha256: null })
      .where('file_sha256', '=', hex(sha))
      .execute();
    await db.deleteFrom('price_lists.files').where('sha256', '=', hex(sha)).execute();
  },

  // Las filas leídas se guardan hasta el día siguiente (diseño de 08, § 2): quedan las de la última
  // aplicada de cada proveedor (su anomalía de filas salteadas puede estar abierta) y las de la prueba
  // de un lector.
  async dropOldRows(before: Date): Promise<void> {
    await sql`
      delete from price_lists.list_rows r using price_lists.lists l
      where l.id = r.list_id and l.status = 'applied' and l.decided_at < ${before}
        and not exists (select 1 from price_lists.suppliers s where s.last_list_id = l.id)
        and not exists (select 1 from price_lists.readers d where d.proof_list_id = l.id)`.execute(
      db,
    );
  },
});

export const filesData = (db: Db) => ({ ...listing(db), ...byHand(db), ...cleanup(db) });
