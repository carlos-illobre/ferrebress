// El lector de las listas de precios (08 · R5; diseño de 08, § 4): lo que recibe y lo que devuelve.
// Lo comparten el servidor y el proceso lector.

// Una celda: su valor (número, texto, verdadero o falso; una fecha, como texto AAAA-MM-DD) y el texto
// que se ve. Una celda vacía es `null`. Las combinadas llegan en su primera celda.
export type Cell = { v: number | string | boolean; t: string } | null;
export type SheetRows = Cell[][];

// Las primeras filas de cada hoja, para reconocer la planilla y para leer cada bloque.
export const headRows = 50;
export type Head = { name: string; rows: SheetRows }[];

// Un bloque de filas de una hoja: desde qué fila (contando desde 0), sus filas y las anteriores
// (hasta `lookBack`), para saber, por ejemplo, la marca del renglón de arriba.
export const blockRows = 5000;
export const lookBack = 1000;
export type Block = { sheet: number; start: number; rows: SheetRows; before: SheetRows };

// Dónde está un dato: la fila y la columna, en la misma hoja. La marca puede estar en un renglón de
// arriba.
export type CellRef = [row: number, col: number];

export const rowKinds = ['product', 'skipped', 'title', 'brand', 'empty'] as const;
export type RowKind = (typeof rowKinds)[number];

// Lo que devuelve un lector por cada fila del bloque: qué es y, en un producto, dónde está cada dato.
// Nunca los datos: el servidor lee las celdas (R5.4, E48).
export type ReaderRow = {
  row: number;
  kind: RowKind;
  // En una salteada, el motivo, si el lector lo sabe (otra moneda, por ejemplo).
  reason?: SkipReason;
  at?: {
    code: CellRef;
    description: CellRef;
    price: CellRef;
    brand?: CellRef;
    vat?: CellRef;
    barcode?: CellRef;
  };
};

// Un lector es un programa de JavaScript que corre encerrado (ADR-021) y deja en `globalThis.reader`
// estas dos funciones. El automático recibe además sus datos en `globalThis.params`.
export type ReaderModule = {
  recognizes(head: Head): 'yes' | 'no' | 'unsure';
  read(block: Block, head: Head): ReaderRow[];
};

// Por qué se salteó una fila (R5.4).
export const skipReasons = [
  'no-code',
  'no-description',
  'no-price',
  'zero-price',
  'not-a-number',
  'repeated-code',
  'other-currency',
] as const;
export type SkipReason = (typeof skipReasons)[number];
