// De dónde salen las filas de una lista (08 · R4, R5; ADR-021): cuántas son, las primeras (para
// reconocerla) y los bloques, de a uno, cada uno con las filas de antes que ve el lector. Un CSV se lee
// de a partes, sin tenerlo entero en memoria; un Excel se abre entero con SheetJS (su formato lo pide)
// y se suelta lo que ya se copió.
import { readFile } from 'node:fs/promises';
import {
  type Block,
  blockRows,
  type Cell,
  type Head,
  headRows,
  lookBack,
  type SheetRows,
} from '@ferrebress/shared/contracts/price-lists';
import { countCsv, recordsOf, rowOf } from './csv.ts';
import type { Job } from './messages.ts';
import { openWorkbook, type Sheet } from './workbook.ts';

export type Source = {
  rows: number;
  head: () => Promise<Head>;
  blocks: () => AsyncGenerator<Block>;
};

// Los bloques de una hoja, cada uno con las `lookBack` filas anteriores.
async function* windowed(sheet: number, rows: AsyncIterable<Cell[]> | Iterable<Cell[]>) {
  let [block, before, start]: [SheetRows, SheetRows, number] = [[], [], 0];
  for await (const row of rows) {
    block.push(row);
    if (block.length < blockRows) continue;
    yield { sheet, start, rows: block, before };
    [before, start, block] = [[...before, ...block].slice(-lookBack), start + block.length, []];
  }
  if (block.length > 0) yield { sheet, start, rows: block, before };
}

function workbookSource(sheets: Sheet[]): Source {
  return {
    rows: sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0),
    head: async () =>
      sheets.map((sheet) => ({ name: sheet.name, rows: sheet.rows.slice(0, headRows) })),
    async *blocks() {
      for (const [index, sheet] of sheets.entries()) yield* windowed(index, sheet.rows);
    },
  };
}

async function* csvRows(path: string, encoding: 'utf-8' | 'windows-1252') {
  for await (const record of recordsOf(path, encoding)) yield rowOf(record);
}

async function csvSource(path: string): Promise<Source | { failed: 'damaged' }> {
  try {
    const { rows, encoding } = await countCsv(path);
    return {
      rows,
      async head() {
        const first: SheetRows = [];
        for await (const row of csvRows(path, encoding)) {
          first.push(row);
          if (first.length === headRows) break;
        }
        // La hoja de un CSV se llama como la llama SheetJS.
        return [{ name: 'Sheet1', rows: first }];
      },
      blocks: () => windowed(0, csvRows(path, encoding)),
    };
  } catch {
    // Contar ya recorrió el archivo: solo falla con un campo que no puede ser de una lista.
    return { failed: 'damaged' };
  }
}

// Un CSV (lo dice su nombre; al subirlo se comprobó que es texto, R4.2) se lee de a partes; lo demás,
// con SheetJS.
export async function sourceOf(job: Job): Promise<Source | { failed: 'too-big' | 'damaged' }> {
  if (job.fileName.toLowerCase().endsWith('.csv')) return csvSource(job.path);
  const opened = openWorkbook(await readFile(job.path));
  return 'failed' in opened ? opened : workbookSource(opened.sheets);
}
