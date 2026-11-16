// Cómo se muestra una anomalía (06 · R9.2), sin tecnología: de la fila a lo que ve la pantalla, con el
// nombre de quien la revisó.
import type { AnomalyView } from '@ferrebress/shared/contracts/anomalies';
import type { AnomalyRow } from './data.ts';

export function viewOf(row: AnomalyRow, names: ReadonlyMap<string, string | null>): AnomalyView {
  const name = row.reviewedBy ? names.get(row.reviewedBy) : undefined;
  return {
    id: row.id,
    kind: row.kind,
    subject: row.subject,
    status: row.status,
    summary: row.summary,
    openedAt: row.openedAt.toISOString(),
    ...(row.reviewedBy && { reviewedBy: { id: row.reviewedBy, ...(name && { name }) } }),
    ...(row.reviewedAt && { reviewedAt: row.reviewedAt.toISOString() }),
    ...(row.note && { note: row.note }),
    ...(row.closedAt && { closedAt: row.closedAt.toISOString() }),
  };
}

// La nota como se guarda: sin espacios de más; vacía, ninguna.
export const noteOf = (note: string | undefined): string | null => note?.trim() || null;
