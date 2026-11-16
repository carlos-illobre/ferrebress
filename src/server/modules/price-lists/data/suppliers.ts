// Las consultas de los proveedores (diseño de 08, § 2): cada dato se cambia mirando el que se vio, y
// cómo cobra va entero, con su versión.
import type { SupplierField, Terms } from '@ferrebress/shared/contracts/price-lists';
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
  lastListDate: string | null;
};

export type NewSupplier = Omit<SupplierRecord, 'inactive' | 'lastListDate' | 'termsVersion'> & {
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

// Leer.
const reads = (db: Db) => ({
  // Los activos o los dados de baja, por nombre.
  list: (inactive: boolean): Promise<SupplierRecord[]> =>
    columns(db).where('inactive', '=', inactive).orderBy('name_key').execute() as Promise<
      SupplierRecord[]
    >,

  // Los que tienen una lista viva (R1.1): leyéndose, en espera o aplicándose.
  withLiveList: async (): Promise<Set<string>> =>
    new Set(
      (
        await db
          .selectFrom('price_lists.lists')
          .select('supplier_id')
          .where('status', 'in', ['reading', 'pending', 'applying'])
          .where('supplier_id', 'is not', null)
          .execute()
      ).map((row) => row.supplier_id as string),
    ),

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
