// Las consultas de los lectores (diseño de 08, § 2): los que se usan al leer, el nuevo del lector
// automático mientras su lista no se aplica (R5.7) y los de un programador, que se copian al arrancar.
import { createHash } from 'node:crypto';
import type { AutoParams } from '../rules/auto.ts';
import { type Db, jsonOf } from './db.ts';

export type UsableReader = {
  id: string;
  supplierId: string | null;
  origin: 'programmer' | 'auto' | 'ai';
  code: string | null;
  params: unknown;
};

export type ProgrammerReader = { fileKey: string; code: string };

// Los que se usan al leer y el nuevo de una lista.
const using = (db: Db) => ({
  // Los activos que no esperan su primera lista, de proveedores activos o de ninguno, del más nuevo
  // al más viejo (R5.2, R5.9).
  usable: async (): Promise<UsableReader[]> =>
    (await db
      .selectFrom('price_lists.readers as r')
      .leftJoin('price_lists.suppliers as s', 's.id', 'r.supplier_id')
      .select(['r.id', 'r.supplier_id as supplierId', 'r.origin', 'r.code', 'r.params'])
      .where('r.active', '=', true)
      .where('r.pending_list_id', 'is', null)
      .where((eb) => eb.or([eb('r.supplier_id', 'is', null), eb('s.inactive', '=', false)]))
      .orderBy('r.created_at', 'desc')
      .orderBy('r.id', 'desc')
      .execute()) as UsableReader[],

  // El lector automático que leyó una lista nueva: queda esperando que se aplique (R5.7).
  async addPending(id: string, listId: string, params: AutoParams, at: Date): Promise<void> {
    await db
      .insertInto('price_lists.readers')
      .values({
        ...{ id, origin: 'auto', template: 'auto-1', params: jsonOf(params) },
        ...{ active: true, pending_list_id: listId, created_at: at },
      })
      .execute();
  },

  // Si la lista no se aplica, el lector se va con ella (R5.7, E45).
  async dropPending(listId: string): Promise<void> {
    await db.deleteFrom('price_lists.readers').where('pending_list_id', '=', listId).execute();
  },
});

// Los de un programador.
const programmer = (db: Db) => ({
  // Los de un programador, copiados si son nuevos o cambiaron; devuelve cuántos.
  async syncProgrammer(readers: readonly ProgrammerReader[], at: Date, idOf: () => string) {
    let changed = 0;
    for (const { fileKey, code } of readers) {
      const sha = createHash('sha256').update(code).digest();
      const row = await db
        .insertInto('price_lists.readers')
        .values({
          id: idOf(),
          origin: 'programmer',
          code,
          file_key: fileKey,
          code_sha: sha,
          created_at: at,
        })
        .onConflict((conflict) =>
          conflict
            .column('file_key')
            .doUpdateSet({ code, code_sha: sha })
            .where('price_lists.readers.code_sha', '<>', sha),
        )
        .returning('id')
        .executeTakeFirst();
      if (row) changed++;
    }
    return changed;
  },
});

export const readersData = (db: Db) => ({ ...using(db), ...programmer(db) });
