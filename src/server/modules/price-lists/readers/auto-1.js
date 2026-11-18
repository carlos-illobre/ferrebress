// El lector automático (08 · R5.3; ADR-021): una plantilla fija que corre encerrada en QuickJS y
// recibe aparte sus datos (`globalThis.params`): en qué columna está cada dato y cómo dice su
// encabezado (vacío, si no lo nombra). Reconoce una planilla si alguna hoja tiene ese encabezado; arriba de él todo es título;
// abajo, una fila con un solo texto y sin precio es el renglón de la marca de las que
// siguen. No devuelve datos: dice dónde están (diseño de 08, § 4).
const params = globalThis.params;
const columns = params.columns;
const fields = Object.keys(columns);

const norm = (text) =>
  String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
const filled = (cell) => cell !== null && cell !== undefined && String(cell.t).trim() !== '';
// Un dato que se encontró por lo que hay en su columna puede no tener nombre: su celda, vacía.
const labelAt = (row, col) => (filled(row[col]) ? norm(row[col].t) : '');
const isHeader = (row) =>
  Array.isArray(row) &&
  fields.every((field) => labelAt(row, columns[field]) === params.labels[field]);
const headerIn = (rows) => rows.findIndex(isHeader);
const isBrand = (row) =>
  Array.isArray(row) && !filled(row[columns.price]) && row.filter(filled).length === 1;
const brandRef = (row, r) => [r, row.findIndex(filled)];

// La marca del último renglón de marca antes del bloque, si está entre las filas que se ven.
function brandBefore(block, header) {
  const first = block.start - block.before.length;
  for (let i = block.before.length - 1; i >= 0; i--) {
    const r = first + i;
    if (r > header && isBrand(block.before[i])) return brandRef(block.before[i], r);
  }
  return undefined;
}

function product(row, r, brand) {
  const at = {
    code: [r, columns.code],
    description: [r, columns.description],
    price: [r, columns.price],
  };
  if (columns.brand !== undefined && filled(row[columns.brand])) at.brand = [r, columns.brand];
  else if (brand) at.brand = brand;
  if (columns.vat !== undefined) at.vat = [r, columns.vat];
  if (columns.barcode !== undefined) at.barcode = [r, columns.barcode];
  return { row: r, kind: 'product', at };
}

globalThis.reader = {
  recognizes: (head) => (head.some((sheet) => headerIn(sheet.rows) >= 0) ? 'yes' : 'no'),
  read(block, head) {
    const header = headerIn(head[block.sheet].rows);
    let brand = brandBefore(block, header);
    return block.rows.map((row, i) => {
      const r = block.start + i;
      if (header < 0 || r <= header || isHeader(row)) return { row: r, kind: 'title' };
      if (!Array.isArray(row) || !row.some(filled)) return { row: r, kind: 'empty' };
      if (isBrand(row)) {
        brand = brandRef(row, r);
        return { row: r, kind: 'brand' };
      }
      return product(row, r, brand);
    });
  },
};
