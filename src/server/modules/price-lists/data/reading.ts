// Las consultas de una lista mientras se sube y se lee (diseño de 08, § 1 y § 8). Lo que llega del
// proceso lector se guarda solo si la lista sigue leyéndose en ese intento: una lectura vieja no pisa
// a una nueva.
import type {
  ListReason,
  ListScope,
  ListStatus,
  SupplierFrom,
} from '@ferrebress/shared/contracts/price-lists';
import { sql } from 'kysely';
import { type Db, dateText } from './db.ts';

export type ListRecord = {
  id: string;
  supplierId: string | null;
  supplierFrom: SupplierFrom | null;
  supplierConfirmed: boolean;
  status: ListStatus;
  waitingFor: 'supplier' | 'size' | null;
  scope: ListScope;
  fileSha: string | null;
  fileName: string;
  listDate: string | null;
  dateFrom: string | null;
  readerId: string | null;
  newReader: boolean;
  rowsTotal: number | null;
  rowsRead: number | null;
  attempts: number;
  reason: ListReason | null;
  readAt: Date | null;
  sizeConfirmed: boolean;
  uploadedBy: string;
  uploadedAt: Date;
};

export type NewList = {
  id: string;
  fileSha: string;
  size: number;
  fileName: string;
  scope: ListScope;
  supplierId: string | null;
  by: string;
  at: Date;
};

const hex = (sha: string) => Buffer.from(sha, 'hex');

const columns = (db: Db) =>
  db
    .selectFrom('price_lists.lists')
    .select([
      ...(['id', 'supplier_id as supplierId', 'supplier_from as supplierFrom'] as const),
      ...([
        'supplier_confirmed as supplierConfirmed',
        'status',
        'waiting_for as waitingFor',
      ] as const),
      ...([
        'scope',
        'file_name as fileName',
        'date_from as dateFrom',
        'reader_id as readerId',
      ] as const),
      ...(['new_reader as newReader', 'rows_total as rowsTotal', 'rows_read as rowsRead'] as const),
      ...(['attempts', 'reason', 'read_at as readAt', 'size_confirmed as sizeConfirmed'] as const),
      ...(['uploaded_by as uploadedBy', 'uploaded_at as uploadedAt'] as const),
      sql<string | null>`encode(file_sha256, 'hex')`.as('fileSha'),
      dateText('list_date').as('listDate'),
    ]);

// Crearla.
const lifecycle = (db: Db) => ({
  // El archivo una vez por contenido (E63), y la lista leyéndose.
  async create(list: NewList): Promise<void> {
    await db
      .insertInto('price_lists.files')
      .values({ sha256: hex(list.fileSha), size: list.size, stored_at: list.at })
      .onConflict((conflict) => conflict.column('sha256').doUpdateSet({ deleting_at: null }))
      .execute();
    await db
      .insertInto('price_lists.lists')
      .values({
        ...{ id: list.id, status: 'reading', scope: list.scope, file_sha256: hex(list.fileSha) },
        ...{ file_name: list.fileName, uploaded_by: list.by, uploaded_at: list.at },
      })
      .execute();
  },
});

// Leerla.
const reads = (db: Db) => ({
  one: (id: string, lock = false): Promise<ListRecord | undefined> =>
    columns(db)
      .where('id', '=', id)
      .$if(lock, (q) => q.forUpdate())
      .executeTakeFirst() as Promise<ListRecord | undefined>,

  // La lista, si sigue leyéndose en ese intento, trabada hasta confirmar.
  reading: (id: string, attempt: number): Promise<ListRecord | undefined> =>
    columns(db)
      .where('id', '=', id)
      .where('status', '=', 'reading')
      .where('attempts', '=', attempt)
      .forUpdate()
      .executeTakeFirst() as Promise<ListRecord | undefined>,
});

// Empezar a leerla y cambiarla.
const changes = (db: Db) => ({
  // Empieza un intento: lo cuenta antes de mandarla al proceso (§ 8). `undefined` si no se lee.
  start: async (id: string): Promise<ListRecord | undefined> => {
    const row = await db
      .updateTable('price_lists.lists')
      .set((eb) => ({ attempts: eb('attempts', '+', 1), rows_read: 0, read_at: null }))
      .where('id', '=', id)
      .where('status', '=', 'reading')
      .returning('id')
      .executeTakeFirst();
    return row
      ? ((await columns(db).where('id', '=', id).executeTakeFirst()) as ListRecord)
      : undefined;
  },

  async set(id: string, values: Partial<Record<ListColumn, unknown>>): Promise<void> {
    await db
      .updateTable('price_lists.lists')
      .set(values as never)
      .where('id', '=', id)
      .execute();
  },
});

// Las de un proveedor y las que usan un archivo.
const queries = (db: Db) => ({
  // Las de un proveedor que siguen vivas, salvo esa (R4.8).
  liveOf: (supplierId: string, except: string) =>
    db
      .selectFrom('price_lists.lists')
      .select(['id', 'status', 'uploaded_at as uploadedAt'])
      .where('supplier_id', '=', supplierId)
      .where('id', '<>', except)
      .where('status', 'in', ['reading', 'pending', 'applying'])
      .execute(),

  // Cuántas listas usan ese contenido: si ninguna, el archivo se puede borrar.
  usesFile: async (sha: string): Promise<number> =>
    Number(
      (
        await db
          .selectFrom('price_lists.lists')
          .select((eb) => eb.fn.countAll<string>().as('count'))
          .where('file_sha256', '=', hex(sha))
          .executeTakeFirstOrThrow()
      ).count,
    ),

  // Las de un proveedor que no se pudieron leer: su anomalía se cierra con una que sí (R9.2).
  unreadableOf: async (supplierId: string): Promise<string[]> =>
    (
      await db
        .selectFrom('price_lists.lists')
        .select('id')
        .where('supplier_id', '=', supplierId)
        .where('status', '=', 'unreadable')
        .execute()
    ).map((row) => row.id),
});

// Al arrancar.
const restart = (db: Db) => ({
  // Las que se leían cuando se apagó el servidor (§ 8), salvo las que esperan que se confirme el tamaño.
  cutOff: async (): Promise<ListRecord[]> =>
    (await columns(db)
      .where('status', '=', 'reading')
      .where('read_at', 'is', null)
      .where((eb) => eb.or([eb('waiting_for', 'is', null), eb('waiting_for', '<>', 'size')]))
      .orderBy('uploaded_at')
      .execute()) as ListRecord[],

  // Las que no se pudieron leer y vuelven a la cola porque cambió el juego de lectores (R5.5): de
  // cada proveedor, la última, si después no subió otra; las de ninguno, todas.
  async rereadable(): Promise<string[]> {
    const rows = await sql<{ id: string }>`
      update price_lists.lists l set status = 'reading', reason = null, attempts = 0
      where l.status = 'unreadable' and not exists (
        select 1 from price_lists.lists o
        where o.supplier_id = l.supplier_id and o.uploaded_at > l.uploaded_at
          and o.status <> 'discarded')
      returning l.id`.execute(db);
    return rows.rows.map((row) => row.id);
  },

  // Una aplicándose cuando se cortó vuelve a esperar (E61): su transacción ya se deshizo.
  async interrupted(): Promise<void> {
    await db
      .updateTable('price_lists.lists')
      .set({ status: 'pending', reason: 'interrupted' })
      .where('status', '=', 'applying')
      .execute();
  },
});

type ListColumn =
  | 'supplier_id'
  | 'supplier_from'
  | 'supplier_confirmed'
  | 'status'
  | 'waiting_for'
  | 'scope'
  | 'list_date'
  | 'date_from'
  | 'reader_id'
  | 'new_reader'
  | 'rows_total'
  | 'rows_read'
  | 'attempts'
  | 'reason'
  | 'read_at'
  | 'size_confirmed'
  | 'decided_by'
  | 'decided_at';

export const readingData = (db: Db) => ({
  ...lifecycle(db),
  ...reads(db),
  ...changes(db),
  ...queries(db),
  ...restart(db),
});

export type ReadingData = ReturnType<typeof readingData>;
