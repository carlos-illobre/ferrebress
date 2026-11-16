// Los procesos lectores (ADR-021): leen en otro proceso; una lista
// cancelada no sigue; un proceso colgado se termina y se reemplaza, y el servidor sigue atendiendo.
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import type { Job, JobMessage } from './messages.ts';
import { createReadingPool } from './pool.ts';

const dir = mkdtempSync(join(tmpdir(), 'pool-'));
const book = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(
  book,
  XLSX.utils.aoa_to_sheet([
    ['Código', 'Descripción', 'Precio'],
    ['A1', 'Mecha', 100],
  ]),
  'H',
);
const path = join(dir, 'lista.xlsx');
writeFileSync(path, XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }));
const autoCode = readFileSync(new URL('../readers/auto-1.js', import.meta.url), 'utf8');

const job = (more: Partial<Job> = {}): Job => ({
  ...{ listId: 'l1', attempt: 1, path, fileName: 'lista.xlsx', supplierId: null, readers: [] },
  ...{ suppliers: [], today: '2026-11-16', confirmRows: null, autoCode },
  limits: { memoryBytes: 64 * 2 ** 20, stackBytes: 2 ** 20, timeMs: 5000 },
  ...more,
});
// Uno que reconoce todo y no termina de leer: para cancelar y para colgar al proceso.
const stuck = {
  id: 'colgado',
  supplierId: null,
  params: null,
  code: 'globalThis.reader = { recognizes: () => "yes", read() { for (;;) {} } };',
};

const pool = createReadingPool({ processes: 2, memoryMb: 512, heapMb: 256, stallMs: 1500 });
afterAll(() => pool.close());

const read = async (input: Job) => {
  const sent: JobMessage[] = [];
  await pool.read(input, (message) => sent.push(message)).finished;
  return sent;
};

describe('los procesos lectores', () => {
  it('leen una lista en otro proceso y cuentan lo que pasa', async () => {
    const sent = await read(job());
    expect(sent.map((message) => message.type)).toEqual(['opened', 'chosen', 'block', 'done']);
    expect(sent[2]).toMatchObject({ products: [{ code: 'A1', listPrice: 100_000_000n }] });
  });

  it('price-lists-E53: un proceso que no dice nada se termina y se reemplaza; la lista queda cortada', async () => {
    const sent = await read(job({ readers: [stuck] }));
    expect(sent.at(-1)).toEqual({ type: 'failed', reason: 'crashed' });
    expect((await read(job())).at(-1)).toEqual({ type: 'done' });
  });

  it('price-lists-E31e: cancelar una que se lee la corta sin que diga nada más; una en la cola, no empieza', async () => {
    const sent: JobMessage[] = [];
    const reading = pool.read(job({ readers: [stuck] }), (message) => sent.push(message));
    const other = pool.read(job({ readers: [stuck] }), () => {});
    const waiting = pool.read(job(), (message) => sent.push(message));
    expect(pool.waiting()).toBe(1);
    waiting.cancel();
    expect(pool.waiting()).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 300));
    reading.cancel();
    other.cancel();
    await Promise.all([reading.finished, other.finished, waiting.finished]);
    expect(sent.map((message) => message.type)).toEqual(['opened']);
    expect((await read(job())).at(-1)).toEqual({ type: 'done' });
  });

  it('un proceso que muere sin trabajo se reemplaza; al cerrar, no', async () => {
    const [first] = pool.processIds();
    process.kill(first as number, 'SIGKILL');
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(pool.processIds()).toHaveLength(2);
    expect(pool.processIds()).not.toContain(first);
    expect((await read(job())).at(-1)).toEqual({ type: 'done' });
    const other = createReadingPool({ processes: 1, memoryMb: 512, heapMb: 256, stallMs: 1500 });
    other.close();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(other.processIds()).toEqual([]);
  });
});
