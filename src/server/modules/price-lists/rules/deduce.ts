// De quién es y de qué fecha es una planilla (08 · R4.3, R4.5; diseño de 08, § 1), sin tecnología: lo
// que dice la planilla en sus primeras filas o el nombre del archivo.
import type { Head } from '@ferrebress/shared/contracts/price-lists';
import { searchKey } from '@ferrebress/shared/text/search-key';
import { textOf } from './cells.ts';

// Las filas de arriba de cada hoja, donde va el título: más abajo ya hay productos.
const titleRows = 10;

const titlesOf = (head: Head): string[] =>
  head.flatMap((sheet) =>
    sheet.rows
      .slice(0, titleRows)
      .flatMap((row) => row.map((cell) => textOf(cell)).filter(Boolean)),
  );

// --- La fecha (R4.5) ---

export type ListDate = { date: string; from: 'sheet' | 'file-name' | 'server'; ignored?: true };

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const real = (y: number, m: number, d: number) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

// La primera fecha escrita en un texto: 14/8/2026, 14-08-26, 14.8.2026 o 2026-08-14.
export function dateIn(text: string): string | undefined {
  for (const match of text.matchAll(/(\d{1,4})[/.-](\d{1,2})[/.-](\d{2,4})/g)) {
    const [a, b, c] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const [y, m, d] = match[1]?.length === 4 ? [a, b, c] : [c < 100 ? 2000 + c : c, b, a];
    if (real(y, m, d)) return iso(y, m, d);
  }
  return undefined;
}

const yearBefore = (today: string) => `${Number(today.slice(0, 4)) - 1}${today.slice(4)}`;

// La de la planilla o, si no dice, la del nombre del archivo. Una posterior a hoy o de más de un año
// atrás no se toma (E84): es la de hoy, en la zona del negocio.
export function listDateOf(head: Head, fileName: string, today: string): ListDate {
  const inSheet = titlesOf(head).map(dateIn).find(Boolean);
  const date = inSheet ?? dateIn(fileName);
  if (!date) return { date: today, from: 'server' };
  if (date > today || date < yearBefore(today))
    return { date: today, from: 'server', ignored: true };
  const from = inSheet ? 'sheet' : 'file-name';
  return { date, from };
}

// --- El proveedor, por su nombre (R4.3) ---

// El proveedor cuyo nombre está escrito, como palabras enteras y sin distinguir acentos ni mayúsculas,
// en el nombre del archivo o en las primeras filas. Si hay varios, el de nombre más largo.
export function supplierByName(
  head: Head,
  fileName: string,
  suppliers: readonly { id: string; nameKey: string }[],
): string | undefined {
  const texts = [fileName.replace(/[_.-]+/g, ' '), ...titlesOf(head)].map(
    (text) => ` ${searchKey(text).replace(/[^\p{L}\p{N}]+/gu, ' ')} `,
  );
  const named = [...suppliers]
    .sort((a, b) => b.nameKey.length - a.nameKey.length)
    .find(({ nameKey }) => {
      const words = ` ${nameKey.replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
      return words.trim() !== '' && texts.some((text) => text.includes(words));
    });
  return named?.id;
}
