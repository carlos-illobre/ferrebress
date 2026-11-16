// Abrir una planilla (ADR-021): cada celda con su valor y lo que se ve; las fechas como texto; las
// fórmulas, con el último valor guardado; las filas vacías, vacías.

import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { openWorkbook } from './workbook.ts';

describe('abrir una planilla', () => {
  it('celdas de cada tipo, una fila vacía en el medio y una fórmula con su último valor', () => {
    const sheet = XLSX.utils.aoa_to_sheet(
      [['Texto', 12.5, true], [], [new Date(Date.UTC(2026, 7, 14))]],
      { cellDates: true },
    );
    sheet.D1 = { t: 'n', v: 42, f: 'HYPERLINK("http://x","y")' };
    sheet.E1 = { t: 'e', v: 7 };
    sheet['!ref'] = 'A1:E3';
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Lista');
    const opened = openWorkbook(
      XLSX.write(book, { type: 'buffer', bookType: 'xlsx', cellDates: true }),
    );
    expect(opened).toEqual({
      sheets: [
        {
          name: 'Lista',
          rows: [
            [
              { v: 'Texto', t: 'Texto' },
              { v: 12.5, t: '12.5' },
              { v: true, t: 'TRUE' },
              { v: 42, t: '42' },
              null,
            ],
            [],
            [{ v: '2026-08-14', t: expect.any(String) }],
          ],
        },
      ],
    });
  });

  it('price-lists-E37: un .xlsx con su contenido roto, dañado', () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['a']]), 'Lista');
    const file = XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    // Los datos comprimidos de cada parte, en cero: el índice dice lo mismo, pero no se descomprimen.
    for (let at = file.indexOf('PK\x03\x04', 0, 'latin1'); at >= 0; ) {
      const start = at + 30 + file.readUInt16LE(at + 26) + file.readUInt16LE(at + 28);
      file.fill(0xff, start, start + file.readUInt32LE(at + 18));
      at = file.indexOf('PK\x03\x04', start, 'latin1');
    }
    expect(openWorkbook(file)).toEqual({ failed: 'damaged' });
  });
});
