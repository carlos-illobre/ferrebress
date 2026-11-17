// Para probar la lectura de las listas (08 · R4, R5): planillas inventadas, armadas por la prueba
// (constitución, VIII), y lectores de mentira que corren encerrados como los de verdad.
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as XLSX from 'xlsx';
import { runJob } from '../../modules/price-lists/reading/job.ts';
import type { Job, JobMessage, JobReader } from '../../modules/price-lists/reading/messages.ts';

export const dir = mkdtempSync(join(tmpdir(), 'listas-'));
export const autoCode = readFileSync(
  new URL('../../modules/price-lists/readers/auto-1.js', import.meta.url),
  'utf8',
);
export const limits = { memoryBytes: 64 * 2 ** 20, stackBytes: 2 ** 20, timeMs: 2000 };
let files = 0;
export const nextName = (extension: string) => `lista-${++files}.${extension}`;

export type Rows = (string | number | null)[][];
export const xlsx = (...sheets: Rows[]) => {
  const book = XLSX.utils.book_new();
  for (const [i, rows] of sheets.entries())
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), `Hoja ${i + 1}`);
  return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
};
export const saved = (content: Buffer | string, name = nextName('xlsx')) => {
  const path = join(dir, name);
  writeFileSync(path, content);
  return path;
};
export const job = (path: string, more: Partial<Job> = {}): Job => ({
  listId: 'l1',
  attempt: 1,
  path,
  fileName: 'lista.xlsx',
  supplierId: null,
  readers: [],
  suppliers: [],
  today: '2026-11-16',
  confirmRows: null,
  autoCode,
  limits,
  ...more,
});
export const run = async (input: Job) => {
  const sent: JobMessage[] = [];
  await runJob(input, (message) => {
    sent.push(message);
  });
  return sent;
};
export const types = (sent: JobMessage[]) => sent.map((message) => message.type);

// Un lector de programador: reconoce si la primera celda dice `marca` y lee código, descripción y
// precio en las columnas 0, 1 y 2 desde la fila 1.
export const reader = (
  id: string,
  supplierId: string | null,
  mark: string,
  body = '',
): JobReader => ({
  id,
  supplierId,
  params: null,
  code: `globalThis.reader = {
    recognizes: (head) => head[0].rows[0]?.[0]?.t === ${JSON.stringify(mark)} ? 'yes' : 'no',
    read(block) { ${body} return block.rows.map((row, i) => {
      const r = block.start + i;
      return r === 0 ? { row: r, kind: 'title' } : { row: r, kind: 'product', at: { code: [r, 0], description: [r, 1], price: [r, 2] } };
    }); },
  };`,
});
