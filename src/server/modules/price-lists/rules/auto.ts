// El lector automático (08 · R5.3, R5.5; diseño de 08, § 4), sin tecnología: busca la fila del
// encabezado por los nombres de siempre y por lo que hay en cada columna, y deja los datos con que lo
// lee su plantilla (readers/auto-1.js). Con dos columnas de precio, o sin código, descripción y precio,
// duda: la lista no se lee y no se pregunta qué columna es qué (E46).
import type { Head, SheetRows } from '@ferrebress/shared/contracts/price-lists';
import { searchKey } from '@ferrebress/shared/text/search-key';
import { type CoreField, columnsLike, freeColumns } from './auto-content.ts';
import { textOf } from './cells.ts';

export type AutoField = 'code' | 'description' | 'price' | 'brand' | 'vat' | 'barcode';
export type AutoParams = {
  columns: Partial<Record<AutoField, number>> & Record<'code' | 'description' | 'price', number>;
  labels: Partial<Record<AutoField, string>>;
};

// Como lo compara la plantilla: sin acentos, en minúsculas y solo letras y números.
export const labelOf = (text: string) =>
  searchKey(text)
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

const names: [AutoField, RegExp][] = [
  ['barcode', /^(ean( ?13)?|cod(igo)? (de )?barras?|barras)$/],
  ['code', /^(cod|codigo|cod art|codigo (de )?articulo|art n|sku|ref|referencia|item)$/],
  ['description', /^(descripcion|detalle|producto|nombre|descripcion del articulo)$/],
  ['price', /^(precio|p unit|p unitario|lista|importe|valor|unitario)( .*)?$/],
  ['brand', /^(marca|linea)$/],
  ['vat', /^(iva|alicuota|alic iva|iva %)$/],
];

// Qué dato es cada columna de una fila; «artículo» es el código si no hay otro, si no la descripción.
function fieldsOf(row: string[]): Map<number, AutoField> {
  const found = new Map<number, AutoField>();
  row.forEach((label, col) => {
    const field = names.find(([, pattern]) => pattern.test(label))?.[0];
    if (field) found.set(col, field);
  });
  const article = row.indexOf('articulo');
  if (article >= 0) {
    const has = (field: AutoField) => [...found.values()].includes(field);
    if (!has('code')) found.set(article, 'code');
    else if (!has('description')) found.set(article, 'description');
  }
  return found;
}

const core: CoreField[] = ['code', 'description', 'price'];

// El encabezado de una fila: lo que nombra y, si nombra dos de los tres datos que hacen falta, el que
// falta por lo que hay en su columna (una sola que lo parezca; con dos, duda).
function headerOf(row: string[], below: SheetRows): AutoParams | 'no' | 'unsure' {
  const found = fieldsOf(row);
  const of = (field: AutoField) => [...found].filter(([, each]) => each === field);
  if ([...found.values()].some((field) => of(field).length > 1)) return 'unsure';
  const missing = core.filter((field) => of(field).length === 0);
  if (missing.length > 1) return 'no';
  for (const field of missing) {
    const like = columnsLike(below, freeColumns(below, new Set(found.keys())), field);
    if (like.length !== 1) return like.length === 0 ? 'no' : 'unsure';
    found.set(like[0] as number, field);
  }
  const columns = Object.fromEntries([...found].map(([col, field]) => [field, col]));
  const labels = Object.fromEntries([...found].map(([col, field]) => [field, row[col] ?? '']));
  return { columns: columns as AutoParams['columns'], labels };
}

export function detectAuto(head: Head): AutoParams | 'no' | 'unsure' {
  for (const sheet of head)
    for (const [at, cells] of sheet.rows.entries()) {
      const row = cells.map((cell) => labelOf(textOf(cell)));
      const header = headerOf(row, sheet.rows.slice(at + 1));
      if (header !== 'no') return header;
    }
  return 'no';
}

// Duda también si casi nada de lo que leyó es un producto (R5.5): una columna mal tomada.
export const autoDoubts = (products: number, skipped: number): boolean =>
  products === 0 || skipped > products;
