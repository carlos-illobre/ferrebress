// Las consultas de los proveedores (diseño de 08, § 2): cada dato se cambia mirando el que se vio, y
// cómo cobra va entero, con su versión.
import type {
  ListReason,
  SupplierField,
  SupplierPending,
  Terms,
} from '@ferrebress/shared/contracts/price-lists';
import { type Db, dateText, jsonOf } from './db.ts';

export type SupplierRecord = {
  id: string;
  name: string;
  seller: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  terms: Terms;
  termsVersion: number;
  inactive: boolean;
  lastListId: string | null;
  lastListDate: string | null;
};

export type NewSupplier = Omit<
  SupplierRecord,
  'inactive' | 'lastListId' | 'lastListDate' | 'termsVersion'
> & {
  nameKey: string;
};

const columns = (db: Db) =>
  db
    .selectFrom('price_lists.suppliers')
    .select([
      'id',
      'name',
      'seller',
      'phone',
      'email',
      'note',
      'terms',
      'terms_version as termsVersion',
      'inactive',
      'last_list_id as lastListId',
      dateText('last_list_date').as('lastListDate'),
    ]);

// El nombre de la columna sale de esta lista fija, nunca del pedido (diseño de 08, § 2).
const columnOf: Record<SupplierField, SupplierField> = {
  name: 'name',
  seller: 'seller',
  phone: 'phone',
  email: 'email',
  note: 'note',
};

// La última lista no descartada de cada proveedor, si está viva o no se pudo leer (R1.1).
async function pendingLists(db: Db): Promise<Map<string, SupplierPending>> {
  const rows = await db
    .selectFrom('price_lists.lists')
    .select(['id', 'supplier_id', 'status', 'reason'])
    .distinctOn('supplier_id')
    .where('supplier_id', 'is not', null)
    .where('status', '!=', 'discarded')
    .orderBy('supplier_id')
    .orderBy('uploaded_at', 'desc')
    .orderBy('id', 'desc')
    .execute();
  return new Map(rows.flatMap((row) => pendingOf(row)));
}

// Leer.
const reads = (db: Db) => ({
  // Los activos o los dados de baja, por nombre.
  list: (inactive: boolean): Promise<SupplierRecord[]> =>
    columns(db).where('inactive', '=', inactive).orderBy('name_key').execute() as Promise<
      SupplierRecord[]
    >,

  pending: () => pendingLists(db),

  one: (id: string, lock = false): Promise<SupplierRecord | undefined> =>
    columns(db)
      .where('id', '=', id)
      .$if(lock, (q) => q.forUpdate())
      .executeTakeFirst() as Promise<SupplierRecord | undefined>,

  // Los activos con su nombre como clave, para saber de quién es una lista por su nombre (R4.3).
  nameKeys: (): Promise<{ id: string; nameKey: string }[]> =>
    db
      .selectFrom('price_lists.suppliers')
      .select(['id', 'name_key as nameKey'])
      .where('inactive', '=', false)
      .execute(),

  byNameKey: (nameKey: string) =>
    db
      .selectFrom('price_lists.suppliers')
      .select(['id', 'inactive'])
      .where('name_key', '=', nameKey)
      .executeTakeFirst(),
});

// Dar de alta y cambiar.
const writes = (db: Db) => ({
  // Si el nombre ya lo tiene otro, no inserta nada y devuelve `false`.
  async create(supplier: NewSupplier): Promise<boolean> {
    const { nameKey, terms, ...rest } = supplier;
    const row = await db
      .insertInto('price_lists.suppliers')
      .values({ ...rest, name_key: nameKey, terms: jsonOf(terms), terms_version: 1 })
      .onConflict((conflict) => conflict.column('name_key').doNothing())
      .returning('id')
      .executeTakeFirst();
    return row !== undefined;
  },

  // Cambia un dato solo si sigue siendo el que se vio. El nombre lleva su clave.
  async change(
    id: string,
    field: SupplierField,
    before: string | null,
    value: string | null,
    nameKey?: string,
  ): Promise<boolean> {
    const column = columnOf[field];
    const result = await db
      .updateTable('price_lists.suppliers')
      .set({ [column]: value, ...(nameKey !== undefined && { name_key: nameKey }) })
      .where('id', '=', id)
      .where((eb) => eb(column, 'is not distinct from', before))
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  },
});

// Cómo cobra y si está dado de baja.
const states = (db: Db) => ({
  async saveTerms(id: string, terms: Terms, version: number): Promise<boolean> {
    const result = await db
      .updateTable('price_lists.suppliers')
      .set({ terms: jsonOf(terms), terms_version: version + 1 })
      .where('id', '=', id)
      .where('terms_version', '=', version)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  },

  // La última lista aplicada (R1.1, R6.10).
  async setLastList(id: string, listId: string, date: string | null): Promise<void> {
    await db
      .updateTable('price_lists.suppliers')
      .set({ last_list_id: listId, last_list_date: date })
      .where('id', '=', id)
      .execute();
  },

  async setInactive(id: string, inactive: boolean): Promise<boolean> {
    const result = await db
      .updateTable('price_lists.suppliers')
      .set({ inactive })
      .where('id', '=', id)
      .where('inactive', '=', !inactive)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  },
});

export const suppliersData = (db: Db) => ({ ...reads(db), ...writes(db), ...states(db) });

type LastList = { id: string; supplier_id: string | null; status: string; reason: string | null };

function pendingOf(row: LastList): [string, SupplierPending][] {
  const supplier = row.supplier_id as string;
  if (row.status === 'unreadable')
    return [[supplier, { listId: row.id, status: 'unreadable', reason: row.reason as ListReason }]];
  if (row.status === 'applied') return [];
  return [[supplier, { listId: row.id, status: row.status as 'pending' }]];
}
