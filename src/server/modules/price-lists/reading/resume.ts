// Al arrancar (diseño de 08, § 8): copia los lectores de un programador que cambiaron, vuelve a poner
// en espera la lista que se estaba aplicando (E61), retoma las que se leían (con dos intentos, quedan
// «No se pudo leer» sin abrir el archivo) y, si cambió el juego de lectores, vuelve a leer la última de
// cada proveedor que no se pudo leer (R5.5, E47).
import { readdirSync, readFileSync } from 'node:fs';
import { newId } from '../../../platform/ids.ts';
import type { PriceListsContext } from '../context.ts';
import { asDb } from '../data/db.ts';
import { type ProgrammerReader, readersData } from '../data/readers.ts';
import { type ListRecord, readingData } from '../data/reading.ts';
import type { Reading } from './service.ts';
import { type Later, steps } from './steps.ts';

// Los lectores de un programador: cada `.js` de la carpeta, salvo las plantillas del automático.
export const programmerReaders = (dir: URL): ProgrammerReader[] =>
  readdirSync(dir)
    .filter((name) => name.endsWith('.js') && !name.startsWith('auto-'))
    .sort()
    .map((fileKey) => ({ fileKey, code: readFileSync(new URL(fileKey, dir), 'utf8') }));

export async function resume(
  ctx: PriceListsContext,
  reading: Reading,
  readers: ProgrammerReader[],
) {
  const db = asDb(ctx.platform.db);
  const { clock } = ctx.platform;
  const changed = await readersData(db).syncProgrammer(readers, clock.now(), () => newId(clock));
  const lists = readingData(db);
  await lists.interrupted();
  for (const list of await lists.cutOff()) {
    if (list.attempts < 2) await reading.start(list.id);
    else await crashed(ctx, list.id, list.attempts);
  }
  if (changed > 0) for (const id of await lists.rereadable()) await reading.start(id);
}

// Un archivo que tumbó el proceso dos veces no se vuelve a abrir.
async function crashed(ctx: PriceListsContext, listId: string, attempt: number) {
  const later: Later = { stop: [], restart: [], after: [] };
  await ctx.platform.db.transaction().execute(async (trx) => {
    // Se leía en ese intento: la acaban de encontrar así.
    const list = (await readingData(asDb(trx)).reading(listId, attempt)) as ListRecord;
    await steps.failed(ctx, trx, list, { type: 'failed', reason: 'crashed' }, later);
  });
  for (const then of later.after) then();
}
