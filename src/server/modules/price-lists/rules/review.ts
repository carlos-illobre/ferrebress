// Ver qué cambia (08 · R6.2 a R6.5, R6.10), sin tecnología: el resumen, los números del botón y cómo
// se muestra cada fila del detalle.
import type {
  ListNumbers,
  ListRow,
  ListScope,
  ListSummary,
} from '@ferrebress/shared/contracts/price-lists';
import type { Counts, DetailRow } from '../data/review.ts';

export function summaryOf(
  counts: Counts,
  gone: { gone: number; active: number },
  list: { scope: ListScope; tooOld: boolean },
  goneWarnPercent: number,
): ListSummary {
  // Una lista de solo cambios no da de baja nada (R4.7, R7.4).
  const lost = list.scope === 'full' ? gone.gone : 0;
  return {
    new: counts.new,
    changed: counts.changed,
    same: counts.same,
    gone: lost,
    skipped: counts.skipped,
    reasons: counts.reasons,
    averageChange: counts.average === null ? null : Math.round(counts.average * 1000) / 10,
    review: counts.review,
    goneWarning: gone.active > 0 && lost * 100 > gone.active * goneWarnPercent,
    tooOld: list.tooOld,
  };
}

// Lo que dice el botón de aplicar (R6.5), y lo que tiene que mandar quien aplica.
export const numbersOf = (summary: ListSummary): ListNumbers => ({
  new: summary.new,
  changed: summary.changed,
  gone: summary.gone,
});

export const sameNumbers = (a: ListNumbers, b: ListNumbers) =>
  a.new === b.new && a.changed === b.changed && a.gone === b.gone;

export function rowOf(row: DetailRow): ListRow {
  return {
    code: row.code,
    description: row.description,
    ...(row.brand && { brand: row.brand }),
    ...(row.change && { change: row.change }),
    ...(row.cost && { cost: row.cost }),
    ...(row.previous && { previous: row.previous }),
    ...(row.variation !== null && { variation: row.variation }),
    ...(row.basis && { basis: row.basis }),
    ...(row.skipped && { skipped: row.skipped }),
    ...(row.cells && { cells: row.cells }),
  };
}

// Dónde sigue la página siguiente: la posición de la última fila, como texto.
export const cursorOf = (row: DetailRow) => `${row.at}:${row.sheet}:${row.row}`;

export function cursorFrom(text: string | undefined): [number, number, number] | undefined | 'bad' {
  if (text === undefined) return undefined;
  const parts = text.split(':').map(Number);
  return parts.length === 3 && parts.every(Number.isFinite)
    ? (parts as [number, number, number])
    : 'bad';
}
