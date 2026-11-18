// Las filas salteadas de la anomalía abierta (08 · R9.2): lo que traía cada una, solo con «Ver costos»,
// de a 50. Se piden al abrir el detalle y se olvidan al cerrarlo.
import type { AnomalyView } from '@ferrebress/shared/contracts/anomalies';
import type { ListRow } from '@ferrebress/shared/contracts/price-lists';
import { useEffect, useState } from 'preact/hooks';
import { skippedRows } from '../price-lists/index.ts';
import { cellsOf, listOf, skipText } from './summary.ts';
import { texts } from './texts.ts';

export type Rows = { rows: ListRow[]; next?: string | undefined; failed: boolean; gone: boolean };

export function useSkippedRows(anomaly: AnomalyView | undefined, canSee: boolean) {
  const [rows, setRows] = useState<Rows>(); // local: se piden de nuevo al abrir el detalle
  const list = anomaly?.kind === 'price-list-skipped-rows' && canSee ? listOf(anomaly) : undefined;
  const load = async (cursor?: string) => {
    if (!list) return;
    const result = await skippedRows(list, cursor);
    if (!result.ok)
      return setRows((now) => ({
        rows: now?.rows ?? [],
        next: now?.next,
        failed: true,
        gone: result.error === 'not-found',
      }));
    setRows((now) => ({
      // Con `cursor`, ya hay filas: es la página siguiente.
      rows: [...(cursor ? (now as Rows).rows : []), ...result.data.rows],
      next: result.data.next,
      failed: false,
      gone: false,
    }));
  };
  useEffect(() => {
    setRows(undefined);
    void load();
  }, [list]);
  return {
    list,
    rows,
    // Cada fila con lo que traía y por qué se salteó, ya resuelto.
    lines: (rows?.rows ?? []).map((row, index) => ({
      key: `${index}-${row.code}`,
      cells: cellsOf(row),
      reason: row.skipped && texts.rowReason(skipText(row.skipped)),
    })),
    hasMore: !!rows?.next && !rows.failed,
    more: () => void load(rows?.next),
  };
}
