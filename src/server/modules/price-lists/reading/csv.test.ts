// Leer un CSV de a partes (08 · R4.2): las comillas, los separadores, los saltos de renglón, la
// codificación, los renglones vacíos y un campo que no puede ser de una lista; también con pedazos
// chicos, para que un campo o un renglón partido entre dos pedazos se lea igual.
import { afterEach, describe, expect, it } from 'vitest';
import { nextName, saved } from '../../../testing/price-lists/sheets.ts';
import { countCsv, csvLimits, delimiterOf, recordsOf, rowOf } from './csv.ts';

const read = async (content: string | Buffer, encoding: 'utf-8' | 'windows-1252' = 'utf-8') => {
  const records: string[][] = [];
  for await (const record of recordsOf(saved(content, nextName('csv')), encoding))
    records.push(record);
  return records;
};

describe('leer un CSV de a partes', () => {
  const chunk = csvLimits.chunkBytes;
  afterEach(() => {
    csvLimits.chunkBytes = chunk;
  });

  it('comillas con separadores, saltos de renglón y comillas dobladas; renglones de Windows', async () => {
    // En pedazos chicos, y con el separador elegido de una muestra larga: un título largo arriba.
    csvLimits.chunkBytes = 3;
    const text =
      'Código;Descripción;Precio\r\nA1;"Mecha; 6 ""mm""";"1.234,50"\r\nA2;"Dos\nrenglones";5\r\n';
    expect(await read(text)).toEqual([
      ['Código', 'Descripción', 'Precio'],
      ['A1', 'Mecha; 6 "mm"', '1.234,50'],
      ['A2', 'Dos\nrenglones', '5'],
    ]);
  });

  it('el separador: el que más aparece al principio; sin ninguno, la coma', () => {
    expect(delimiterOf('a,b,c')).toBe(',');
    expect(delimiterOf('a\tb\tc;d')).toBe('\t');
    expect(delimiterOf('"a;b",c|d|e')).toBe('|');
    expect(delimiterOf('sola')).toBe(',');
    expect(delimiterOf('Lista de precios\nA;B;C\nD;E;F')).toBe(';');
  });

  it('sin salto al final, el último renglón igual; un renglón vacío queda vacío; las celdas vacías no son celdas', async () => {
    expect(await read('a,b\n\nc,')).toEqual([['a', 'b'], [''], ['c', '']]);
    expect(rowOf([''])).toEqual([]);
    expect(rowOf(['a', '', 'b', '', ''])).toEqual([{ v: 'a', t: 'a' }, null, { v: 'b', t: 'b' }]);
    expect(await read('')).toEqual([]);
  });

  it('en UTF-8 si lo es, con su marca o sin ella; si no, en Windows-1252', async () => {
    const text = 'Código;Descripción\nA1;Mecha ñandú\n';
    for (const [content, encoding] of [
      [Buffer.from(text), 'utf-8'],
      [Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text)]), 'utf-8'],
      [Buffer.from(text, 'latin1'), 'windows-1252'],
    ] as const) {
      const path = saved(content, nextName('csv'));
      expect(await countCsv(path)).toEqual({ rows: 2, encoding });
      const records: string[][] = [];
      for await (const record of recordsOf(path, encoding)) records.push(record);
      expect(records[1]).toEqual(['A1', 'Mecha ñandú']);
    }
  });

  it('un campo más largo que el tope no es una lista, también entre comillas', async () => {
    const long = 'x'.repeat(csvLimits.fieldChars + 1);
    await expect(countCsv(saved(`a;${long}\n`, nextName('csv')))).rejects.toThrow();
    await expect(countCsv(saved(`a;"${long}"\n`, nextName('csv')))).rejects.toThrow();
  });
});
