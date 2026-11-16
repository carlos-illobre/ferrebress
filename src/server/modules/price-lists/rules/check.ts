// La comprobación (08 · R5.4; diseño de 08, § 4), sin tecnología: lo que devuelve un lector no se da
// por bueno sin revisarlo. Cada fila del bloque tiene su clase; las celdas que señala existen; y el
// servidor lee las celdas. Un producto sin código, sin descripción o sin un precio mayor que cero, o con
// un código que ya salió en la lista, pasa a fila salteada con su motivo. Los títulos, los renglones de
// marca y las filas vacías no se guardan.
import {
  type Block,
  type Cell,
  type CellRef,
  type ReaderRow,
  rowKinds,
  type SheetRows,
  type SkipReason,
  skipReasons,
} from '@ferrebress/shared/contracts/price-lists';
import { searchKey } from '@ferrebress/shared/text/search-key';
import * as z from 'zod/mini';
import { priceOf, textOf, vatOf } from './cells.ts';

const maxColumns = 16_384;
const ref = z.tuple([
  z.int().check(z.minimum(0)),
  z.int().check(z.minimum(0), z.maximum(maxColumns)),
]);
const readerRow = z.object({
  row: z.int(),
  kind: z.enum(rowKinds),
  reason: z.optional(z.enum(skipReasons)),
  at: z.optional(
    z.object({
      code: ref,
      description: ref,
      price: ref,
      brand: z.optional(ref),
      vat: z.optional(ref),
      barcode: z.optional(ref),
    }),
  ),
});
const readerOutput = z.array(readerRow);

// Los largos que se guardan (diseño de 08, § 2).
export const rowLimits = { code: 60, description: 300, brand: 80, barcode: 40 } as const;

export type ProductRow = {
  sheet: number;
  row: number;
  code: string;
  description: string;
  brand: string | null;
  barcode: string | null;
  listPrice: bigint;
  vat: number | null;
  searchKey: string;
};
export type SkippedRow = {
  sheet: number;
  row: number;
  reason: SkipReason;
  code: string | null;
  description: string | null;
  // Lo que traía la fila, como texto (R9.2).
  cells: string[];
};
export type Checked = { products: ProductRow[]; skipped: SkippedRow[] };
export type CheckProblem = 'bad-output' | 'missing-rows' | 'bad-cell';

const cut = (text: string, max: number): string | null => (text === '' ? null : text.slice(0, max));

// Lo que trae una fila salteada, para verla: cada celda como texto. La fila es del bloque: existe.
const cellsOf = (rows: SheetRows, row: number) => (rows[row] as Cell[]).map((cell) => textOf(cell));

// Cada fila del bloque tiene una sola clase, y ninguna de afuera.
function byRowOf(block: Block, output: ReaderRow[]): Map<number, ReaderRow> | undefined {
  const byRow = new Map(output.map((one) => [one.row, one]));
  const end = block.start + block.rows.length;
  const outside = [...byRow.keys()].some((r) => r < block.start || r >= end);
  return byRow.size === block.rows.length && !outside ? byRow : undefined;
}

// Comprueba un bloque. `rows` son todas las filas de la hoja (una marca puede estar arriba del
// bloque); `seen`, los códigos de la lista hasta acá, que se suman.
export function checkBlock(
  block: Block,
  rows: SheetRows,
  output: unknown,
  seen: Set<string>,
): Checked | { problem: CheckProblem } {
  const parsed = readerOutput.safeParse(output);
  if (!parsed.success) return { problem: 'bad-output' };
  const byRow = byRowOf(block, parsed.data as ReaderRow[]);
  if (!byRow) return { problem: 'missing-rows' };
  const checked: Checked = { products: [], skipped: [] };
  for (const one of byRow.values()) {
    const result = rowOf(block.sheet, rows, one, seen);
    if (result === 'bad-cell') return { problem: 'bad-cell' };
    if (result && 'reason' in result) checked.skipped.push(result);
    else if (result) checked.products.push(result);
  }
  const byPlace = (x: { row: number }, y: { row: number }) => x.row - y.row;
  checked.products.sort(byPlace);
  checked.skipped.sort(byPlace);
  return checked;
}

const exists = (rows: SheetRows, [row]: CellRef) => row < rows.length;
const at = (rows: SheetRows, [row, col]: CellRef) => rows[row]?.[col];

type Skip = (reason: SkipReason, code?: string | null, description?: string | null) => SkippedRow;

function rowOf(
  sheet: number,
  rows: SheetRows,
  one: ReaderRow,
  seen: Set<string>,
): ProductRow | SkippedRow | 'bad-cell' | undefined {
  if (one.kind === 'title' || one.kind === 'brand' || one.kind === 'empty') return undefined;
  const skip: Skip = (reason, code = null, description = null) => ({
    ...{ sheet, row: one.row, reason, code, description },
    cells: cellsOf(rows, one.row),
  });
  if (one.kind === 'skipped' || !one.at) return skip(one.reason ?? 'no-price');
  const refs = Object.values(one.at) as CellRef[];
  if (!refs.every((each) => exists(rows, each))) return 'bad-cell';
  return productOf(sheet, rows, one.row, one.at, seen, skip);
}

// Un producto, o la fila salteada con el primer motivo que tenga (R5.4).
function productOf(
  sheet: number,
  rows: SheetRows,
  row: number,
  where: NonNullable<ReaderRow['at']>,
  seen: Set<string>,
  skip: Skip,
): ProductRow | SkippedRow {
  const code = textOf(at(rows, where.code));
  const description = cut(textOf(at(rows, where.description)), rowLimits.description);
  if (code === '' || code.length > rowLimits.code) return skip('no-code', null, description);
  if (!description) return skip('no-description', code);
  const price = priceOf(at(rows, where.price));
  if ('skipped' in price) return skip(price.skipped, code, description);
  if (seen.has(code)) return skip('repeated-code', code, description);
  seen.add(code);
  const brand = where.brand ? cut(textOf(at(rows, where.brand)), rowLimits.brand) : null;
  return {
    sheet,
    row,
    code,
    description,
    brand,
    barcode: where.barcode ? cut(textOf(at(rows, where.barcode)), rowLimits.barcode) : null,
    listPrice: price.price,
    vat: where.vat ? vatOf(at(rows, where.vat)) : null,
    searchKey: searchKey(`${code} ${description} ${brand ?? ''}`),
  };
}
