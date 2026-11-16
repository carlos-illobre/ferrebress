// Las consultas de Más → Administración → Lectores (08 · R5.8): verlos con su proveedor y su última
// lista, desactivarlos y asociar uno de un programador a un proveedor.
import type { ReaderOrigin } from '@ferrebress/shared/contracts/price-lists';
import { sql } from 'kysely';
import type { Db } from './db.ts';

export type ReaderLine = {
  id: string;
  origin: ReaderOrigin;
  supplierId: string | null;
  supplierName: string | null;
  active: boolean;
  createdAt: Date;
  lastListId: string | null;
  lastFileName: string | null;
  lastListDate: string | null;
};

const columns = sql`r.id, r.origin, r.supplier_id as "supplierId", s.name as "supplierName", r.active,
  r.created_at as "createdAt", r.last_list_id as "lastListId", l.file_name as "lastFileName",
  l.list_date::text as "lastListDate"`;

export const readerAdminData = (db: Db) => ({
  // Los que no esperan su primera lista, por proveedor y del más nuevo al más viejo.
  list: async (): Promise<ReaderLine[]> =>
    (
      await sql<ReaderLine>`select ${columns} from price_lists.readers r
        left join price_lists.suppliers s on s.id = r.supplier_id
        left join price_lists.lists l on l.id = r.last_list_id
        where r.pending_list_id is null
        order by s.name nulls first, r.created_at desc, r.id desc`.execute(db)
    ).rows,

  one: async (id: string): Promise<(ReaderLine & { pending: boolean }) | undefined> =>
    (
      await sql<ReaderLine & { pending: boolean }>`select ${columns},
          r.pending_list_id is not null as pending
        from price_lists.readers r
        left join price_lists.suppliers s on s.id = r.supplier_id
        left join price_lists.lists l on l.id = r.last_list_id
        where r.id = ${id}`.execute(db)
    ).rows[0],

  async setActive(id: string, active: boolean): Promise<void> {
    await db.updateTable('price_lists.readers').set({ active }).where('id', '=', id).execute();
  },

  async setSupplier(id: string, supplierId: string): Promise<void> {
    await db
      .updateTable('price_lists.readers')
      .set({ supplier_id: supplierId })
      .where('id', '=', id)
      .execute();
  },
});
