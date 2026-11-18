// Lo que muestra ver qué cambia (08 · pantalla 3, R6), resuelto para cualquier vista: de quién es la
// lista, el resumen con sus filtros, el botón de aplicar con lo que va a pasar, los avisos y cada
// producto con su cuenta. Sin pedidos.
import {
  type ListProgress,
  type ListRow,
  type ListState,
  type ListSummary,
  numbersOf,
  type RowsShow,
} from '@ferrebress/shared/contracts/price-lists';
import { formatPesos } from '@ferrebress/shared/money/money';
import { type CostBasis, stepsOf } from '@ferrebress/shared/pricing/basis';
import { nowMs, shownDate, sinceOf } from '../../../platform/time.ts';
import { listReasonTexts, skipReasonTexts } from '../texts-status.ts';
import { reviewTexts as texts } from './texts.ts';

const decimal = (value: number) => value.toLocaleString('es-AR', { maximumFractionDigits: 1 });
// La variación, con su signo: «+12,5 %».
export const variationOf = (value: number) => `${value > 0 ? '+' : ''}${decimal(value)} %`;
const pesos = (micro: string) => formatPesos(BigInt(micro));

export function headerOf(state: ListState) {
  return {
    supplier: state.supplier ? texts.of(state.supplier.name) : texts.noSupplier,
    date: state.listDate ? texts.date(shownDate(state.listDate)) : texts.noDate,
    scope: state.scope === 'full' ? texts.full : texts.partial,
    uploaded: texts.uploaded(
      state.uploadedBy ?? texts.someone,
      sinceOf(Date.parse(state.uploadedAt), nowMs()),
    ),
    fileName: state.fileName,
    newReader: !!state.newReader,
  };
}

export type Show = RowsShow | null;

// El resumen (R6.2, R6.4): cada número que tiene algo filtra el detalle; tocar el elegido lo saca.
export function chipsOf(summary: ListSummary, show: Show, partial: boolean) {
  const average = summary.averageChange === null ? '' : variationOf(summary.averageChange);
  const chips: { value: RowsShow; label: string; count: number }[] = [
    { value: 'review', label: texts.chips.review(summary.review), count: summary.review },
    { value: 'new', label: texts.chips.new(summary.new), count: summary.new },
    {
      value: 'changed',
      label: texts.chips.changed(summary.changed, average),
      count: summary.changed,
    },
    { value: 'same', label: texts.chips.same(summary.same), count: summary.same },
    { value: 'gone', label: texts.chips.gone(summary.gone), count: partial ? 0 : summary.gone },
    { value: 'skipped', label: texts.chips.skipped(summary.skipped), count: summary.skipped },
  ];
  return chips
    .filter((chip) => chip.count > 0 || chip.value === show)
    .map(({ value, label }) => ({
      value,
      label,
      pressed: value === show,
      urgent: value === 'review',
    }));
}

// El botón dice lo que va a pasar; si da de baja de más, también eso (R6.5).
export const applyLabelOf = (summary: ListSummary) =>
  summary.goneWarning ? texts.applyAndDrop(summary.gone) : texts.apply(numbersOf(summary));

// La cuenta de un costo (R3.4, E17): precio de lista, sin IVA, cada descuento y de qué lista salió.
export const stepsLines = (basis: CostBasis) => [
  ...stepsOf(basis).map((step) => {
    const amount = formatPesos(step.amount);
    if (step.kind === 'list') return texts.steps.list(amount);
    if (step.kind === 'vat') return texts.steps.vat(decimal(step.vat / 10), amount);
    return texts.steps.discount(step.name, decimal(step.percent / 100), amount);
  }),
  ...(basis.listDate ? [texts.steps.date(shownDate(basis.listDate))] : []),
];

// El costo de antes, el nuevo y cuánto cambia; uno nuevo no tenía, uno que ya no viene no tiene.
function costsOf(row: ListRow) {
  return {
    previous: row.previous
      ? texts.previousCost(pesos(row.previous))
      : row.change === 'new'
        ? texts.noPrevious
        : undefined,
    cost: row.cost ? texts.newCost(pesos(row.cost)) : texts.gone,
    variation: row.variation === undefined ? undefined : variationOf(row.variation),
    steps: row.basis ? stepsLines(row.basis) : undefined,
  };
}

export type RowLines = {
  code: string;
  description: string;
  brand?: string | undefined;
  previous?: string | undefined;
  cost?: string;
  variation?: string | undefined;
  steps?: string[] | undefined;
  skipped?: string;
  cells?: string;
};

// Un producto del detalle (R6.3) o una fila salteada, con lo que traía y su motivo.
export const rowLines = (row: ListRow): RowLines => ({
  code: row.code ?? '',
  description: row.description ?? '',
  brand: row.brand,
  ...(row.skipped
    ? {
        skipped: texts.skippedRow(skipReasonTexts[row.skipped]),
        cells: (row.cells ?? []).filter(Boolean).join(' · '),
      }
    : costsOf(row)),
});

// Por qué no se aplicó la última vez, si volvió a esperar (R6.6).
export const failedOf = (state: ListState) =>
  state.status === 'pending' && state.reason
    ? texts.applyFailed(listReasonTexts[state.reason])
    : undefined;

const statusTexts: Partial<Record<ListState['status'], string>> = texts.statuses;

// Lo que se ve de la lista, resuelto: su cabecera, el resumen, los avisos, el botón y en qué está.
export function viewOf(state: ListState, progress: ListProgress | undefined, show: Show) {
  const summary = state.summary;
  return {
    header: headerOf(state),
    chips: summary ? chipsOf(summary, show, state.scope === 'partial') : [],
    goneWarning: summary?.goneWarning ? texts.goneWarning(summary.gone) : undefined,
    tooOld: !!summary?.tooOld,
    reviewing: show === 'review',
    failed: failedOf(state),
    status: statusTexts[state.status],
    applying:
      state.status === 'applying'
        ? texts.applying(progress?.applied ?? 0, progress?.rowsTotal ?? state.rowsTotal)
        : undefined,
    applied: state.result ? texts.applied(state.result) : undefined,
    file: state.file,
  };
}
