// Volver a leer las que no se pudieron (08 · R5.5; diseño de 08, § 8): solo las que no entendió ningún
// lector; una dañada o que tumbó el proceso saldría igual.
import { sql } from 'kysely';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

type Rows = (string | number)[][];
const sheet = (title: string, rows: Rows) =>
  xlsx([[title], ['Código', 'Descripción', 'Precio'], ...rows]);

describe('volver a leer', () => {
  let kit: ListsKit;
  beforeAll(async () => {
    kit = await createListsKit();
  });
  afterAll(() => kit.server.close());
  beforeEach(() => kit.later(61_000));

  it('al llegar un lector no se vuelve a leer una que tumbó el proceso o que está dañada: saldría igual', async () => {
    const supplierId = await kit.supplier('Pinturas Oeste');
    const db = kit.server.platform.db;
    const ids: Record<string, string> = {};
    for (const reason of ['crashed', 'damaged', 'no-reader']) {
      const sent = await kit.upload(sheet('Lista', [['A1', 'Mecha', 10]]), {
        name: `${reason}.xlsx`,
      });
      await kit.server.priceLists.idle();
      ids[reason] = sent.body.id;
      await sql`update price_lists.lists set status = 'unreadable', reason = ${reason},
        supplier_id = ${reason === 'no-reader' ? null : supplierId} where id = ${sent.body.id}`.execute(
        db,
      );
    }
    // Llega un lector de un programador: cambió el juego de lectores.
    kit.addReader('nuevo.js', 'globalThis.reader = { recognizes: () => "no", read: () => [] };');
    await kit.server.priceLists.resume();
    await kit.server.priceLists.idle();
    expect(await kit.list(ids.crashed as string)).toMatchObject({
      status: 'unreadable',
      reason: 'crashed',
    });
    expect(await kit.list(ids.damaged as string)).toMatchObject({
      status: 'unreadable',
      reason: 'damaged',
    });
    expect(await kit.list(ids['no-reader'] as string)).not.toMatchObject({ status: 'unreadable' });
  });
});
