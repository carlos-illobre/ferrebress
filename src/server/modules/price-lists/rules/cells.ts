// Leer un dato de una celda que señaló un lector (diseño de 08, § 4), sin tecnología: el servidor
// convierte una sola vez para todos los lectores, así ninguno devuelve números (R5.4, E48). Las celdas
// se toman siempre como texto, sin armar nada con él (E68).
import type { Cell, SkipReason } from '@ferrebress/shared/contracts/price-lists';

// Sin caracteres de control ni los que dan vuelta el texto, y sin espacios de más.
const unsafe = /[\p{Cc}\p{Bidi_Control}]/gu;
export const textOf = (cell: Cell | undefined): string =>
  cell ? cell.t.replace(unsafe, ' ').replace(/\s+/g, ' ').trim() : '';

// Más de $ 1 billón no es un precio de una ferretería: es un número mal leído (diseño de 08, § 10).
const maxPrice = 1_000_000_000_000n * 1_000_000n;
const otherCurrency = /(u\$s|us\$|usd|u\$d|dólar|dolar|€|eur\b|r\$)/i;

// Un número escrito como texto, en millonésimos: «$ 2.314,00», «1.234,5», «2314.5». El punto con
// grupos de a tres es de miles; la coma, de decimales.
function microOfText(raw: string): bigint | undefined {
  const text = raw.replace(/\$|ars|\s/gi, '');
  const negative = text.startsWith('-');
  const digits = negative ? text.slice(1) : text;
  let whole: string;
  let decimals = '';
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(digits) || /^\d+(,\d+)?$/.test(digits)) {
    [whole, decimals = ''] = digits.replace(/\./g, '').split(',') as [string, string?];
  } else if (/^\d+\.\d+$/.test(digits)) {
    [whole, decimals = ''] = digits.split('.') as [string, string?];
  } else return undefined;
  const micro = BigInt(whole) * 1_000_000n + BigInt(decimals.slice(0, 6).padEnd(6, '0'));
  return negative ? -micro : micro;
}

const microOfNumber = (value: number): bigint | undefined =>
  Number.isFinite(value) && Math.abs(value) < 1e15
    ? microOfText(value.toFixed(6).replace('.', ','))
    : undefined;

export type Price = { price: bigint } | { skipped: SkipReason };

// El precio de lista de una fila (R5.4): sin precio, otra moneda, que no es un número o cero.
export function priceOf(cell: Cell | undefined): Price {
  const text = textOf(cell);
  if (!cell || text === '') return { skipped: 'no-price' };
  if (otherCurrency.test(text)) return { skipped: 'other-currency' };
  const micro = typeof cell.v === 'number' ? microOfNumber(cell.v) : microOfText(text);
  if (micro === undefined || micro > maxPrice) return { skipped: 'not-a-number' };
  if (micro <= 0n) return { skipped: 'zero-price' };
  return { price: micro };
}

// El IVA en décimos (21 % es 210): «21 %», «10,5», «0,21» o el número. Uno que no se entiende no
// cuenta: vale el de arranque del proveedor (R3.6).
export function vatOf(cell: Cell | undefined): number | null {
  const text = textOf(cell).replace(/iva|%|\s/gi, '');
  if (text === '') return null;
  const value = typeof cell?.v === 'number' ? cell.v : Number(text.replace(',', '.'));
  if (!Number.isFinite(value) || value < 0) return null;
  const percent = value > 0 && value < 1 ? value * 100 : value;
  const tenths = Math.round(percent * 10);
  return tenths <= 1000 && Math.abs(percent * 10 - tenths) < 1e-6 ? tenths : null;
}
