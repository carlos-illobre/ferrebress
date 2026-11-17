// Lo que se dice de cada anomalía (06 · R9.2, 08 · R9.2): de qué se trata, armado con lo que guardó el
// capítulo que la abrió. Lo guardado se lee con cuidado: un dato que falta no se dice.
import type { AnomalyView } from '@ferrebress/shared/contracts/anomalies';
import type { ListReason, SkipReason } from '@ferrebress/shared/contracts/price-lists';
import { nowMs, sinceOf } from '../../platform/time.ts';
import { listReasonTexts, skipReasonTexts } from '../price-lists/index.ts';
import { texts } from './texts.ts';

type Summary = {
  file?: string;
  reason?: ListReason;
  supplier?: { id: string; name: string };
  skipped?: number;
  reasons?: Partial<Record<SkipReason, number>>;
};

// La lista que la causó (`price-lists:list:<id>`), si es de una.
export const listOf = (anomaly: AnomalyView): string | undefined =>
  anomaly.subject.match(/^price-lists:list:([0-9a-f-]{36})$/)?.[1];

function skippedLine(summary: Summary): string | undefined {
  if (summary.skipped === undefined) return undefined;
  const reasons = Object.entries(summary.reasons ?? {})
    .filter(([reason]) => reason in skipReasonTexts)
    .map(([reason, n]) => texts.reason(n as number, skipReasonTexts[reason as SkipReason]));
  return [texts.skipped(summary.skipped), reasons.join(', ')].filter(Boolean).join(': ');
}

const since = (at: string) => sinceOf(Date.parse(at), nowMs());

// Quién la revisó y cuándo, o cuándo se cerró sola.
function stateOf(anomaly: AnomalyView): string | undefined {
  if (anomaly.status === 'reviewed' && anomaly.reviewedAt)
    return texts.reviewedBy(anomaly.reviewedBy?.name ?? texts.someone, since(anomaly.reviewedAt));
  if (anomaly.status === 'closed' && anomaly.closedAt)
    return texts.closedAt(since(anomaly.closedAt));
  return undefined;
}

export function linesOf(anomaly: AnomalyView) {
  const summary = anomaly.summary as unknown as Summary;
  const reason = summary.reason && listReasonTexts[summary.reason];
  return {
    kind: texts.kinds[anomaly.kind],
    when: texts.when(since(anomaly.openedAt)),
    state: stateOf(anomaly),
    supplier: summary.supplier?.name ?? texts.noSupplier,
    file: summary.file,
    detail: anomaly.kind === 'price-list-skipped-rows' ? skippedLine(summary) : reason,
  };
}

export const skipText = (reason: SkipReason) => skipReasonTexts[reason];

// Lo que traía una fila salteada, celda por celda, sin las vacías.
export const cellsOf = (row: { cells?: string[] }) => (row.cells ?? []).filter(Boolean).join(' · ');
