// Lo que hay en cada columna (08 · R5.3), sin tecnología: debajo del encabezado, qué columna parece un
// código, una descripción o un precio. Sirve para el dato que el encabezado no nombra.
import type { Cell, SheetRows } from '@ferrebress/shared/contracts/price-lists';
import { priceOf, textOf } from './cells.ts';

export type CoreField = 'code' | 'description' | 'price';

// Cuántas filas de abajo se miran, y qué parte de lo que hay en la columna tiene que parecerlo.
export const contentLimits = { rows: 30, share: 0.8 };

const looks: Record<CoreField, (text: string, cell: NonNullable<Cell>) => boolean> = {
  price: (_text, cell) => 'price' in priceOf(cell),
  description: (text) => /\p{L}/u.test(text) && text.includes(' ') && text.length >= 6,
  code: (text) => text.length <= 20 && !text.includes(' '),
};

// Las columnas de `free` que parecen `field`, mirando las celdas con algo de las filas de abajo.
export function columnsLike(below: SheetRows, free: number[], field: CoreField): number[] {
  const rows = below.slice(0, contentLimits.rows);
  return free.filter((col) => {
    const cells = rows
      .map((row) => row[col])
      .filter((cell): cell is NonNullable<Cell> => !!cell && textOf(cell) !== '');
    const alike = cells.filter((cell) => looks[field](textOf(cell), cell));
    return cells.length >= 2 && alike.length >= contentLimits.share * cells.length;
  });
}

// Las columnas que el encabezado no nombra, hasta la más ancha de las filas de abajo.
export function freeColumns(below: SheetRows, named: Set<number>): number[] {
  const width = Math.max(0, ...below.slice(0, contentLimits.rows).map((row) => row.length));
  return Array.from({ length: width }, (_, col) => col).filter((col) => !named.has(col));
}
