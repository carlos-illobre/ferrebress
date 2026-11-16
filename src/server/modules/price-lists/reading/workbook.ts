// Abrir una planilla con SheetJS (ADR-021): los tres formatos quedan como lo mismo, hojas con filas
// de celdas, cada celda con su valor y el texto que se ve. Con las opciones cerradas: sin fórmulas (el
// último valor que guardó Excel, E68), sin HTML, sin archivos adjuntos ni macros.
import type { Cell, SheetRows } from '@ferrebress/shared/contracts/price-lists';
import * as XLSX from 'xlsx';
import { isZip, zipFits } from './zip.ts';

export type Sheet = { name: string; rows: SheetRows };
export type Opened = { sheets: Sheet[] } | { failed: 'too-big' | 'damaged' };

type RawCell = { t: string; v?: unknown; w?: string } | undefined;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

// Un `.xls` de Excel es un archivo compuesto de OLE: empieza con estos bytes.
const isOle = (file: Buffer) => file.length >= 4 && file.readUInt32BE(0) === 0xd0cf11e0;

// Un CSV (o una tabla con nombre `.xls`) es texto: en UTF-8 si lo es y, si no, en Windows-1252, como lo
// guarda Excel en castellano. La marca del principio la saca TextDecoder.
function textOf(file: Buffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(file);
  } catch {
    return new TextDecoder('windows-1252').decode(file);
  }
}

function cellOf(raw: RawCell): Cell {
  if (!raw || raw.t === 'z' || raw.t === 'e' || raw.v === undefined || raw.v === null) return null;
  const v = raw.v instanceof Date ? isoDate(raw.v) : (raw.v as number | string | boolean);
  // Con `cellText` (de arranque), SheetJS deja siempre el texto que se ve.
  return { v, t: raw.w as string };
}

export function openWorkbook(file: Buffer): Opened {
  if (isZip(file) && !zipFits(file)) return { failed: 'too-big' };
  let book: XLSX.WorkBook;
  try {
    const binary = isZip(file) || isOle(file);
    book = XLSX.read(binary ? file : textOf(file), {
      type: binary ? 'buffer' : 'string',
      // El texto queda como texto: «1.234,50» lo lee priceOf, con el punto de miles.
      raw: !binary,
      dense: true,
      cellDates: true,
      cellFormula: false,
      cellHTML: false,
      bookFiles: false,
      bookVBA: false,
      WTF: false,
    });
  } catch {
    return { failed: 'damaged' };
  }
  const sheets = book.SheetNames.map((name) => {
    // En modo denso, cada hoja trae sus filas en `!data`, aunque esté vacía; una fila vacía es un hueco.
    const data = (book.Sheets[name] as XLSX.WorkSheet)['!data'] as (RawCell[] | undefined)[];
    const rows: SheetRows = [];
    for (let r = 0; r < data.length; r++) rows.push((data[r] ?? []).map(cellOf));
    return { name, rows };
  });
  return { sheets };
}
