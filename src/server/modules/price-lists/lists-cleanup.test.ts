// Lo que se borra solo (08 · R4.4; 06 · R8.6, R8.7; diseño de 08, § 8): el archivo de la aplicada
// anterior, los de listas que nunca se aplicaron, los más viejos al pasar el tamaño, los que quedaron sin
// fila y las filas leídas viejas.
import { utimes } from 'node:fs/promises';
import { sql } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

type Rows = (string | number)[][];
const sheet = (title: string, rows: Rows) =>
  xlsx([[title], ['Código', 'Descripción', 'Precio'], ...rows]);
const day = 24 * 60 * 60_000;

describe('lo que se borra solo', () => {
  let kit: ListsKit;
  beforeAll(async () => {
    kit = await createListsKit();
  });
  afterAll(() => kit.server.close());
  beforeEach(() => kit.later(61_000));

  const apply = async (id: string, expected: object) => {
    await kit.loader.device.request(`/api/price-lists/lists/${id}/apply`, { expected });
    await kit.server.priceLists.idle();
  };

  it('price-lists-E88, E89 y E90 y las filas viejas: lo que se borra solo', async () => {
    const supplierId = await kit.supplier('Sanitarios Este');
    const first = await kit.upload(sheet('Lista 1/8/2026', [['A1', 'Mecha', 10]]), { supplierId });
    await apply(first.body.id, { new: 1, changed: 0, gone: 0 });
    const second = await kit.upload(sheet('Lista 2/8/2026', [['A1', 'Mecha', 11]]), { supplierId });
    await apply(second.body.id, { new: 0, changed: 1, gone: 0 });
    const third = await kit.upload(sheet('Lista 3/8/2026', [['A1', 'Mecha', 12]]), { supplierId });
    await apply(third.body.id, { new: 0, changed: 1, gone: 0 });
    // Una descartada hace más de los días del ajuste: su archivo se va (E90).
    const old = await kit.upload(sheet('Lista vieja', [['Z1', 'Vieja', 1]]));
    expect(
      (await kit.loader.device.request(`/api/price-lists/lists/${old.body.id}/discard`, {})).body,
    ).toMatchObject({ status: 'discarded' });
    const orphan = await kit.server.platform.files.save(
      (async function* () {
        yield new TextEncoder().encode('huérfano');
      })(),
      100,
    );
    // Los archivos sin fila se borran pasada una hora: antes pueden ser de una subida en curso.
    const files = kit.server.platform.files;
    const aged = new Date(Date.now() - 2 * 60 * 60_000);
    for (const sha of await files.list(-1)) {
      const path = files.pathOf(sha);
      if (path) await utimes(path, aged, aged);
    }
    expect(orphan).not.toBe('too-big');
    // Como si hubiera pasado más de un mes: la descartada, subida hace 40 días; las aplicadas, hace 2.
    const db = kit.server.platform.db;
    const ago = (days: number) => new Date(kit.server.platform.clock.now().getTime() - days * day);
    await sql`update price_lists.lists set uploaded_at = ${ago(40)} where id = ${old.body.id}`.execute(
      db,
    );
    await sql`update price_lists.lists set decided_at = ${ago(2)} where supplier_id = ${supplierId}`.execute(
      db,
    );
    kit.later(10_000);
    await kit.server.runJobs();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await kit.list(old.body.id)).toMatchObject({ file: false });
    const rows = await sql<{ list_id: string }>`select distinct list_id from price_lists.list_rows
      where list_id in (${first.body.id}, ${second.body.id}, ${third.body.id})`.execute(
      kit.server.platform.db,
    );
    expect(rows.rows.map((one) => one.list_id).sort()).toEqual(
      [first.body.id, third.body.id].sort(),
    );
    const stored = await kit.server.platform.files.list(-1);
    const known = (await kit.viewer.device.request('/api/price-lists/files')).body.files.map(
      (one: { sha256: string }) => one.sha256,
    );
    expect(stored.sort()).toEqual(known.sort());
    // Al pasar el tamaño, los más viejos (E89): con el mínimo, 10 MB.
    await kit.setting('filesMb', 10);
    const big = (n: number) =>
      Buffer.from(
        `Código,Descripción,Precio\n${`X${n},${'Descripción larga '.repeat(6)},1\n`.repeat(60_000)}`,
      );
    const a = await kit.upload(big(1), { name: 'grande.csv' });
    // Se la cancela mientras se lee, así su archivo ya no hace falta.
    await kit.loader.device.request(`/api/price-lists/lists/${a.body.id}/cancel`, {});
    const b = await kit.upload(big(2), { name: 'grande.csv' });
    expect(await kit.list(a.body.id)).toMatchObject({ file: false });
    expect(await kit.list(b.body.id)).toMatchObject({ file: true });
  });
});
