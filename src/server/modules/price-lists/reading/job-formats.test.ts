// Leer una lista en el proceso lector (08 · R4.2, R4.12): los formatos, lo dañado y el aviso de las
// planillas grandes.

import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { job, nextName, run, saved, xlsx } from '../../../testing/price-lists/sheets.ts';

const formatA = [['FORMATO A'], ['A1', 'Mecha', 100], ['A2', 'Tarugo', 200]];

describe('leer una lista: los formatos y los avisos', () => {
  it('price-lists-E91: con más filas que el aviso, pregunta antes de leer', async () => {
    const path = saved(xlsx(formatA));
    expect(await run(job(path, { confirmRows: 2 }))).toEqual([{ type: 'size', rows: 3 }]);
  });

  it('price-lists-E37: un archivo dañado o vacío no se lee', async () => {
    const broken = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x72, 0x6f, 0x74, 0x6f]);
    expect(await run(job(saved(broken)))).toEqual([{ type: 'failed', reason: 'too-big' }]);
    expect(await run(job(saved(xlsx([]))))).toEqual([{ type: 'failed', reason: 'empty' }]);
  });

  it('una lista en CSV se lee igual, en UTF-8 o como la guarda Excel', async () => {
    const text = 'Código;Descripción;Precio\nA1;Mecha ñandú;"1.234,50"\n';
    for (const content of [
      Buffer.from(text),
      Buffer.from(text, 'latin1'),
      Buffer.from(`\ufeff${text}`),
    ]) {
      const sent = await run(job(saved(content, `${nextName('csv')}`)));
      expect(sent.at(-2)).toMatchObject({
        products: [{ code: 'A1', description: 'Mecha ñandú', listPrice: 1_234_500_000n }],
      });
    }
  });

  it('un .xls de Excel también', async () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet([
        ['Código', 'Artículo', 'Lista'],
        ['X1', 'Pala', 5000],
      ]),
      'H',
    );
    const sent = await run(
      job(saved(XLSX.write(book, { type: 'buffer', bookType: 'biff8' }), 'vieja.xls')),
    );
    expect(sent.at(-2)).toMatchObject({ products: [{ code: 'X1', listPrice: 5_000_000_000n }] });
  });
});
