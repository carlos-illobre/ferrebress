// Leer un CSV de a partes (08 · R4.2; ADR-021): se recorre el archivo como flujo, sin tenerlo entero en
// memoria, y se entregan sus renglones de a uno. Como lo guarda Excel en castellano: en UTF-8 si lo es y,
// si no, en Windows-1252; el separador, el que más aparece en las primeras filas (`;`, `,`, tabulador
// o `|`); un campo entre comillas puede tener separadores, saltos de renglón y comillas dobladas. Cada
// celda queda como texto, igual que la que se ve: «1.234,50» lo lee priceOf, con el punto de miles.
import { createReadStream } from 'node:fs';
import type { Cell } from '@ferrebress/shared/contracts/price-lists';

export type Encoding = 'utf-8' | 'windows-1252';

// Un campo más largo que esto no es una lista: se corta, así un archivo armado no llena la memoria.
export const csvLimits = { fieldChars: 64 * 1024, chunkBytes: 64 * 1024 };

export class CsvTooLong extends Error {}

async function* textOf(path: string, encoding: Encoding): AsyncGenerator<string> {
  // El de UTF-8 falla con un byte que no lo es: entonces es Windows-1252. La marca del principio la
  // saca TextDecoder.
  const decoder = new TextDecoder(encoding, { fatal: encoding === 'utf-8' });
  for await (const part of createReadStream(path, { highWaterMark: csvLimits.chunkBytes }))
    yield decoder.decode(part as Buffer, { stream: true });
  yield decoder.decode();
}

// El separador: el que más aparece en las primeras filas, fuera de comillas (la primera suele ser un
// título, sin ninguno); sin ninguno, la coma.
export function delimiterOf(sample: string): string {
  const counts = new Map<string, number>();
  let quoted = false;
  for (const char of sample) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && ';,\t|'.includes(char)) counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ',';
}

type State = { field: string; record: string[]; quoted: boolean; closed: boolean };

// Dentro de comillas, o recién cerradas: devuelve si se ocupó del carácter.
function quotedStep(state: State, char: string): boolean {
  if (state.quoted) {
    if (char === '"') [state.quoted, state.closed] = [false, true];
    else state.field += char;
    if (state.field.length > csvLimits.fieldChars) throw new CsvTooLong();
    return true;
  }
  const doubled = state.closed && char === '"';
  state.closed = false;
  // Una comilla doblada dentro de un campo entre comillas.
  if (doubled) [state.field, state.quoted] = [`${state.field}"`, true];
  return doubled;
}

// Un carácter: arma el campo y el renglón; devuelve el renglón cuando termina.
function step(state: State, char: string, delimiter: string): string[] | undefined {
  if (quotedStep(state, char)) return undefined;
  if (char === '"' && state.field === '') state.quoted = true;
  else if (char === delimiter) {
    state.record.push(state.field);
    state.field = '';
  } else if (char === '\n') {
    const record = [...state.record, state.field];
    [state.record, state.field] = [[], ''];
    return record;
  } else if (char !== '\r') state.field += char;
  if (state.field.length > csvLimits.fieldChars) throw new CsvTooLong();
  return undefined;
}

// Cuánto texto se mira para elegir el separador: las primeras filas, o lo que haya.
const sampleChars = 16 * 1024;

// El texto, empezando cuando ya se sabe el separador: con una muestra del principio, o todo si es menos.
async function* withDelimiter(texts: AsyncIterable<string>) {
  let pending = '';
  let delimiter: string | undefined;
  for await (const text of texts) {
    if (delimiter) {
      yield { delimiter, text };
      continue;
    }
    pending += text;
    if (pending.length < sampleChars) continue;
    delimiter = delimiterOf(pending.slice(0, sampleChars));
    yield { delimiter, text: pending };
  }
  if (!delimiter && pending) yield { delimiter: delimiterOf(pending), text: pending };
}

// Los renglones, de a uno: cada uno, sus campos como texto.
export async function* recordsOf(path: string, encoding: Encoding): AsyncGenerator<string[]> {
  const state: State = { field: '', record: [], quoted: false, closed: false };
  for await (const { delimiter, text } of withDelimiter(textOf(path, encoding)))
    for (const char of text) {
      const record = step(state, char, delimiter);
      if (record) yield record;
    }
  if (state.field !== '' || state.record.length > 0) yield [...state.record, state.field];
}

// Un renglón como fila de celdas: lo vacío no es una celda, y no hay celdas vacías al final.
export function rowOf(record: string[]): Cell[] {
  const row: Cell[] = record.map((text) => (text === '' ? null : { v: text, t: text }));
  while (row.length > 0 && row.at(-1) === null) row.pop();
  return row;
}

async function count(path: string, encoding: Encoding) {
  let rows = 0;
  for await (const _ of recordsOf(path, encoding)) rows++;
  return rows;
}

// Cuántos renglones tiene, y en qué está escrito: si no es UTF-8, Windows-1252.
export async function countCsv(path: string): Promise<{ rows: number; encoding: Encoding }> {
  try {
    return { rows: await count(path, 'utf-8'), encoding: 'utf-8' };
  } catch (error) {
    if (error instanceof CsvTooLong) throw error;
    return { rows: await count(path, 'windows-1252'), encoding: 'windows-1252' };
  }
}
