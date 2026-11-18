// Volver a leer las que no se pudieron (08 · R5.5; diseño de 08, § 8): solo las que no entendió ningún
// lector; una vacía o que tumbó el proceso saldría igual.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createListsKit, type ListsKit } from '../../testing/price-lists/lists-kit.ts';
import { xlsx } from '../../testing/price-lists/sheets.ts';

// Un lector de un programador para el formato «FORMATO <letra>»; `body` corre antes de leer.
const reader = (letters: string, body = '') => `globalThis.reader = {
  recognizes: (head) => ${JSON.stringify(letters.split(''))}.some((l) => head[0].rows[0]?.[0]?.t === 'FORMATO ' + l) ? 'yes' : 'no',
  read(block) { ${body} return block.rows.map((row, i) => {
    const r = block.start + i;
    return r === 0 ? { row: r, kind: 'title' } : { row: r, kind: 'product', at: { code: [r, 0], description: [r, 1], price: [r, 2] } };
  }); },
};`;
const sheet = (letter: string) => xlsx([[`FORMATO ${letter}`], [`${letter}1`, 'Algo', 100]]);

describe('volver a leer', () => {
  let kit: ListsKit;
  beforeAll(async () => {
    kit = await createListsKit({ stallMs: 1500 });
  });
  afterAll(() => kit.server.close());

  it('al llegar un lector no se vuelve a leer una que tumbó el proceso o que está vacía: saldría igual', async () => {
    // Uno que se cuelga con el formato C: la lista tumba el proceso dos veces.
    kit.addReader('formatos.js', reader('C', 'for (;;) {}'));
    await kit.server.priceLists.resume();
    const crashed = await kit.upload(sheet('C'));
    const empty = await kit.upload(xlsx([]));
    const unknown = await kit.upload(sheet('X'));
    expect(await kit.list(crashed.body.id)).toMatchObject({
      status: 'unreadable',
      reason: 'crashed',
    });
    expect(await kit.list(empty.body.id)).toMatchObject({ status: 'unreadable', reason: 'empty' });
    expect(await kit.list(unknown.body.id)).toMatchObject({
      status: 'unreadable',
      reason: 'no-reader',
    });
    // Llega una versión que lee los dos formatos: solo se vuelve a leer la que nadie entendía.
    kit.addReader('formatos.js', reader('CX'));
    await kit.server.priceLists.resume();
    await kit.server.priceLists.idle();
    expect(await kit.list(crashed.body.id)).toMatchObject({
      status: 'unreadable',
      reason: 'crashed',
    });
    expect(await kit.list(empty.body.id)).toMatchObject({ status: 'unreadable', reason: 'empty' });
    expect(await kit.list(unknown.body.id)).not.toMatchObject({ status: 'unreadable' });
    // Asociar el lector a un proveedor también es un cambio en los lectores: se prueba de nuevo.
    const other = await kit.upload(sheet('Y'));
    const programmer = (await kit.admin.request('/api/price-lists/readers')).body.readers.find(
      (one: { origin: string }) => one.origin === 'programmer',
    );
    const supplierId = await kit.supplier('Bulonera Y');
    await kit.admin.request(`/api/price-lists/readers/${programmer.id}/supplier`, { supplierId });
    await kit.server.priceLists.idle();
    expect(await kit.list(other.body.id)).toMatchObject({
      status: 'unreadable',
      reason: 'no-reader',
    });
  });
});
